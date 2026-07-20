import os
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

load_dotenv()

MONGODB_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017/cerebrio")

client = None
db = None
IS_MOCK = False

# Simple in-memory storage for fallback mode
mock_db = {
    "users": [],
    "projects": [],
    "documents": [],
    "quizzes": [],
    "attempts": [],
    "chat_sessions": []
}

def get_database():
    """Returns database instance."""
    global client, db, IS_MOCK
    if IS_MOCK:
        return None
    if db is None:
        try:
            client = AsyncIOMotorClient(MONGODB_URI, serverSelectionTimeoutMS=2000)
            db = client.get_default_database()
        except Exception as e:
            print(f"Failed to initialize MongoDB client: {e}. Switching to mock database.")
            IS_MOCK = True
            db = None
    return db

async def ping_database():
    global IS_MOCK
    try:
        database = get_database()
        if database is None:
            return False
        # The motor client ping command
        await database.command("ping")
        return True
    except Exception as e:
        print(f"MongoDB connection failed: {e}. Switching to mock database.")
        IS_MOCK = True
        return False

class MockCollection:
    def __init__(self, name: str):
        self.name = name

    async def find_one(self, filter, *args, **kwargs):
        for doc in mock_db.get(self.name, []):
            match = True
            for k, v in filter.items():
                if doc.get(k) != v:
                    match = False
                    break
            if match:
                return doc
        return None

    async def insert_one(self, document):
        if "_id" not in document:
            document["_id"] = str(len(mock_db.get(self.name, [])) + 1)
        mock_db[self.name].append(document)
        return type('obj', (object,), {'inserted_id': document["_id"]})()

    async def update_one(self, filter, update, upsert=False):
        doc = await self.find_one(filter)
        if doc:
            for k, v in update.get("$set", {}).items():
                doc[k] = v
        elif upsert:
            new_doc = filter.copy()
            for k, v in update.get("$set", {}).items():
                new_doc[k] = v
            await self.insert_one(new_doc)
        return type('obj', (object,), {'modified_count': 1})()

    def find(self, filter=None, *args, **kwargs):
        class Cursor:
            def __init__(self, items):
                self.items = items
            def sort(self, *args, **kwargs):
                return self
            def limit(self, *args, **kwargs):
                return self
            async def to_list(self, length=None):
                return self.items

        items = []
        filter = filter or {}
        for doc in mock_db.get(self.name, []):
            match = True
            for k, v in filter.items():
                if doc.get(k) != v:
                    match = False
                    break
            if match:
                items.append(doc)
        return Cursor(items)

def get_collection(name: str):
    """Returns specific collection, falling back to mock collection if database is offline."""
    database = get_database()
    if database is None or IS_MOCK:
        print(f"[MOCK] Accessing simulated collection: {name}")
        return MockCollection(name)
    return database[name]
