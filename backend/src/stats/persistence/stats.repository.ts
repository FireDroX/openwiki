export interface StatsRepository {
  countPages(): Promise<number>;
  countComments(): Promise<number>;
  countUsers(): Promise<number>;
  countMedia(): Promise<number>;
}
