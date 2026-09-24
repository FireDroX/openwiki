import { Inject, Injectable } from '@nestjs/common';
import {
  GLOBAL_PERMISSIONS,
  GlobalPermission,
  PAGE_ACTIONS,
  PageAction,
} from '../../common/permissions.js';
import { User } from '../../users/entities/user.entity.js';
import { PageAccessRule } from '../entities/page-access-rule.entity.js';
import type { GroupsRepository } from '../persistence/groups.repository.js';
import type { PageAccessRulesRepository } from '../persistence/page-access-rules.repository.js';
import type {
  PageChain,
  PageHierarchyRepository,
} from '../persistence/page-hierarchy.repository.js';
import type { SubjectPermissionsRepository } from '../persistence/subject-permissions.repository.js';

interface RuleContext {
  rule: PageAccessRule;
  excludedPageIds: string[];
}

interface UserContext {
  globalPermissions: Set<GlobalPermission>;
  rules: RuleContext[];
}

function ruleCoversChain(
  rule: PageAccessRule,
  excludedPageIds: string[],
  chain: PageChain,
): boolean {
  const { chainIds } = chain;

  if (rule.appliesTo === 'page') {
    if (rule.pageId !== chain.pageId) {
      return false;
    }
    return !excludedPageIds.includes(chain.pageId);
  }

  const boundaryIndex =
    rule.pageId === null ? chainIds.length - 1 : chainIds.indexOf(rule.pageId);
  if (boundaryIndex === -1) {
    return false;
  }

  for (let i = 0; i <= boundaryIndex; i += 1) {
    if (excludedPageIds.includes(chainIds[i])) {
      return false;
    }
  }
  return true;
}

function actionsFromRules(
  rules: RuleContext[],
  chain: PageChain,
): Set<PageAction> {
  const actions = new Set<PageAction>();
  for (const { rule, excludedPageIds } of rules) {
    if (!ruleCoversChain(rule, excludedPageIds, chain)) {
      continue;
    }
    for (const action of rule.actions) {
      actions.add(action);
    }
  }
  if ([...actions].some((action) => action !== 'page.read')) {
    actions.add('page.read');
  }
  return actions;
}

@Injectable()
export class PermissionsService {
  constructor(
    @Inject('GroupsRepository')
    private readonly groupsRepository: GroupsRepository,
    @Inject('SubjectPermissionsRepository')
    private readonly subjectPermissionsRepository: SubjectPermissionsRepository,
    @Inject('PageAccessRulesRepository')
    private readonly pageAccessRulesRepository: PageAccessRulesRepository,
    @Inject('PageHierarchyRepository')
    private readonly pageHierarchyRepository: PageHierarchyRepository,
  ) {}

  private async loadUserContext(user: User): Promise<UserContext> {
    const groupIds = await this.groupsRepository.findGroupIdsForUser(user.id);
    const [directPermissions, groupPermissions, directRules, groupRules] =
      await Promise.all([
        this.subjectPermissionsRepository.findForUser(user.id),
        this.subjectPermissionsRepository.findForGroups(groupIds),
        this.pageAccessRulesRepository.findByUserId(user.id),
        this.pageAccessRulesRepository.findByGroupIds(groupIds),
      ]);

    const allRules = [...directRules, ...groupRules];
    const exclusionsByRule =
      await this.pageAccessRulesRepository.findExclusionsForRules(
        allRules.map((rule) => rule.id),
      );

    return {
      globalPermissions: new Set([
        ...directPermissions,
        ...groupPermissions,
      ] as GlobalPermission[]),
      rules: allRules.map((rule) => ({
        rule,
        excludedPageIds: exclusionsByRule.get(rule.id) ?? [],
      })),
    };
  }

  async hasGlobal(
    user: User | undefined,
    permission: GlobalPermission,
  ): Promise<boolean> {
    if (!user) {
      return false;
    }
    // Literal ticket order: admin bypass (rule 1) is checked before the
    // isActive gate (rule 2) — an inactive admin still has full access.
    if (user.role === 'admin') {
      return true;
    }
    if (!user.isActive) {
      return false;
    }
    const context = await this.loadUserContext(user);
    return context.globalPermissions.has(permission);
  }

  async getEffectiveGlobalPermissions(
    user: User | undefined,
  ): Promise<GlobalPermission[]> {
    if (!user) {
      return [];
    }
    if (user.role === 'admin') {
      return [...GLOBAL_PERMISSIONS];
    }
    if (!user.isActive) {
      return [];
    }
    const context = await this.loadUserContext(user);
    return [...context.globalPermissions];
  }

  async can(
    user: User | undefined,
    action: PageAction,
    pageId: string,
  ): Promise<boolean> {
    const chains = await this.pageHierarchyRepository.findChains([pageId]);
    const chain = chains.get(pageId);
    if (!chain) {
      return false;
    }
    if (action === 'page.read' && chain.visibility === 'public') {
      return true;
    }
    if (!user) {
      return false;
    }
    if (user.role === 'admin') {
      return true;
    }
    if (!user.isActive) {
      return false;
    }
    const context = await this.loadUserContext(user);
    return actionsFromRules(context.rules, chain).has(action);
  }

  async getEffectivePageActions(
    user: User | undefined,
    pageId: string,
  ): Promise<PageAction[]> {
    const chains = await this.pageHierarchyRepository.findChains([pageId]);
    const chain = chains.get(pageId);
    if (!chain) {
      return [];
    }
    const actions = new Set<PageAction>();
    if (chain.visibility === 'public') {
      actions.add('page.read');
    }
    if (!user) {
      return [...actions];
    }
    if (user.role === 'admin') {
      return [...PAGE_ACTIONS];
    }
    if (!user.isActive) {
      return [...actions];
    }
    const context = await this.loadUserContext(user);
    for (const action of actionsFromRules(context.rules, chain)) {
      actions.add(action);
    }
    return [...actions];
  }
}
