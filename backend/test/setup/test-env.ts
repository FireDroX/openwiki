process.env.DB_DATABASE =
  process.env.DB_DATABASE_TEST ??
  `${process.env.DB_DATABASE ?? 'openwiki'}_test`;
