const { MongoClient } = require('mongodb');

class Database {
  constructor() {
    this.client = null;
    this.db = null;
  }

  async connect() {
    try {
      const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/ai-image-app';
      
      this.client = new MongoClient(mongoUri, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
      });

      await this.client.connect();
      this.db = this.client.db();
      
      console.log('MongoDB连接成功');
      return this.db;
    } catch (error) {
      console.warn('MongoDB连接失败，使用内存模式:', error.message);
      // 使用内存模拟数据库
      this.db = this.createMockDatabase();
      return this.db;
    }
  }

  async disconnect() {
    if (this.client) {
      await this.client.close();
      console.log('MongoDB连接已关闭');
    }
  }

  getDb() {
    if (!this.db) {
      throw new Error('数据库未连接，请先调用connect()');
    }
    return this.db;
  }

  // 获取集合
  getCollection(name) {
    return this.getDb().collection(name);
  }

  // 创建内存模拟数据库
  createMockDatabase() {
    const mockCollections = new Map();
    
    return {
      collection: (name) => {
        if (!mockCollections.has(name)) {
          mockCollections.set(name, this.createMockCollection());
        }
        return mockCollections.get(name);
      }
    };
  }

  // 创建内存模拟集合
  createMockCollection() {
    const data = [];
    
    return {
      async insertOne(doc) {
        const id = Date.now().toString();
        const newDoc = { ...doc, _id: id };
        data.push(newDoc);
        return { insertedId: id };
      },
      
      async find(query = {}) {
        return {
          toArray: async () => data.filter(doc => 
            Object.keys(query).every(key => doc[key] === query[key])
          )
        };
      },
      
      async findOne(query = {}) {
        return data.find(doc => 
          Object.keys(query).every(key => doc[key] === query[key])
        ) || null;
      },
      
      async updateOne(query, update) {
        const index = data.findIndex(doc => 
          Object.keys(query).every(key => doc[key] === query[key])
        );
        if (index !== -1) {
          data[index] = { ...data[index], ...update.$set };
          return { matchedCount: 1, modifiedCount: 1 };
        }
        return { matchedCount: 0, modifiedCount: 0 };
      },
      
      async deleteOne(query) {
        const index = data.findIndex(doc => 
          Object.keys(query).every(key => doc[key] === query[key])
        );
        if (index !== -1) {
          data.splice(index, 1);
          return { deletedCount: 1 };
        }
        return { deletedCount: 0 };
      }
    };
  }
}

// 创建单例实例
const database = new Database();

// 自动连接数据库
database.connect().catch(console.error);

module.exports = database; 