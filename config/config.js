module.exports = {
  dialect: 'mysql',
  host: 'localhost',
  username: 'root',
  password: 'root',
  database: 'lampiaopi',
  define: {  
  timestamps: true, // garante que vou ter as colunas
  underscored: true, // garante uma padronização de tabelas e colunas
  underscoredAll:true,
  },
  };
  
