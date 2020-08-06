import { MongoClient } from 'mongodb';
export default function connect(mongoDbUri: string): Promise<MongoClient>;
