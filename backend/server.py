from fastapi import FastAPI, APIRouter, HTTPException, Depends, UploadFile, File, Form
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone, timedelta
import jwt
import bcrypt
import aiofiles
import shutil
import cloudinary
import cloudinary.uploader
import cloudinary.api
import certifi

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(
    mongo_url,
    tlsCAFile=certifi.where(),
    serverSelectionTimeoutMS=5000
)
db = client[os.environ['DB_NAME']]

# JWT Settings
JWT_SECRET = os.environ.get('JWT_SECRET', 'vistagram-super-secret-key-2024')
JWT_ALGORITHM = 'HS256'
JWT_EXPIRATION_HOURS = 72

# Create the main FastAPI app
app = FastAPI(title="Vistagram API")

# Create API router
api_router = APIRouter(prefix="/api")

# Security
security = HTTPBearer()

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Configure Cloudinary
cloudinary.config( 
  cloud_name = os.environ.get('CLOUDINARY_CLOUD_NAME'), 
  api_key = os.environ.get('CLOUDINARY_API_KEY'), 
  api_secret = os.environ.get('CLOUDINARY_API_SECRET'),
  secure = True
)

# ================== MODELS ==================

class UserCreate(BaseModel):
    username: str
    email: str
    password: str

class UserLogin(BaseModel):
    email: str
    password: str

class UserUpdate(BaseModel):
    username: Optional[str] = None
    avatar: Optional[str] = None
    banner: Optional[str] = None
    bio: Optional[str] = None
    status: Optional[str] = None
    theme: Optional[str] = None

class ServerCreate(BaseModel):
    name: str
    icon: Optional[str] = None
    description: Optional[str] = ""

class ChannelCreate(BaseModel):
    name: str
    channel_type: str = "text"
    server_id: str
    category_id: Optional[str] = None

class MessageCreate(BaseModel):
    content: str
    channel_id: str
    attachments: Optional[List[str]] = []

class DMCreate(BaseModel):
    recipient_id: str

class DMMessageCreate(BaseModel):
    content: str
    dm_id: str

class ReelCreate(BaseModel):
    title: str
    description: Optional[str] = ""
    video_url: str
    thumbnail_url: Optional[str] = None

class CommentCreate(BaseModel):
    content: str
    reel_id: str

class ForumCategoryCreate(BaseModel):
    name: str
    description: Optional[str] = ""
    color: Optional[str] = "#ef4444"
    icon: Optional[str] = None

class ForumPostCreate(BaseModel):
    title: str
    content: str
    category_id: str
    attachments: Optional[List[str]] = []

class ForumReplyCreate(BaseModel):
    content: str
    post_id: str
    attachments: Optional[List[str]] = []

class ProductCreate(BaseModel):
    name: str
    description: str
    price: float
    category: str
    images: List[str] = []
    file_url: Optional[str] = None

class StudioProjectCreate(BaseModel):
    name: str
    description: Optional[str] = ""
    thumbnail: Optional[str] = None
    project_type: str = "game"

# ================== AUTH HELPERS ==================

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode(), hashed.encode())

def create_token(user_id: str) -> str:
    payload = {
        'user_id': user_id,
        'exp': datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRATION_HOURS),
        'iat': datetime.now(timezone.utc)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    try:
        payload = jwt.decode(credentials.credentials, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user = await db.users.find_one({'id': payload['user_id']}, {'_id': 0, 'password': 0})
        if not user:
            raise HTTPException(status_code=401, detail='User not found')
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail='Token expired')
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail='Invalid token')

# ================== AUTH ENDPOINTS ==================

@api_router.post("/auth/signup")
async def signup(user_data: UserCreate):
    existing = await db.users.find_one({'$or': [{'email': user_data.email}, {'username': user_data.username}]})
    if existing:
        raise HTTPException(status_code=400, detail='User already exists')
    
    user_id = str(uuid.uuid4())
    discriminator = str(uuid.uuid4().int)[:4]
    
    user_doc = {
        'id': user_id,
        'username': user_data.username,
        'email': user_data.email,
        'password': hash_password(user_data.password),
        'avatar': f"https://api.dicebear.com/7.x/avataaars/svg?seed={user_data.username}",
        'banner': None,
        'bio': '',
        'status': 'online',
        'is_premium': False,
        'theme': 'liquid-glass',
        'discriminator': discriminator,
        'servers': [],
        'friends': [],
        'followers': [],
        'following': [],
        'robux': 0,
        'created_at': datetime.now(timezone.utc).isoformat()
    }
    
    await db.users.insert_one(user_doc)
    token = create_token(user_id)
    
    user_response = {k: v for k, v in user_doc.items() if k not in ['_id', 'password']}
    return {'token': token, 'user': user_response}

@api_router.post("/auth/login")
async def login(credentials: UserLogin):
    user = await db.users.find_one({'email': credentials.email})
    if not user or not verify_password(credentials.password, user['password']):
        raise HTTPException(status_code=401, detail='Invalid credentials')
    
    await db.users.update_one({'id': user['id']}, {'$set': {'status': 'online'}})
    token = create_token(user['id'])
    
    user_response = {k: v for k, v in user.items() if k not in ['_id', 'password']}
    return {'token': token, 'user': user_response}

@api_router.get("/auth/me")
async def get_me(current_user: dict = Depends(get_current_user)):
    return current_user

@api_router.put("/auth/profile")
async def update_profile(updates: UserUpdate, current_user: dict = Depends(get_current_user)):
    update_data = {k: v for k, v in updates.model_dump().items() if v is not None}
    
    if update_data:
        await db.users.update_one({'id': current_user['id']}, {'$set': update_data})
    
    updated_user = await db.users.find_one({'id': current_user['id']}, {'_id': 0, 'password': 0})
    return updated_user

@api_router.get("/users/{user_id}")
async def get_user_profile(user_id: str, current_user: dict = Depends(get_current_user)):
    user = await db.users.find_one({'id': user_id}, {'_id': 0, 'password': 0, 'email': 0})
    if not user:
        raise HTTPException(status_code=404, detail='User not found')
    
    # Get stats
    user['reels_count'] = await db.reels.count_documents({'author_id': user_id})
    user['posts_count'] = await db.forum_posts.count_documents({'author_id': user_id})
    user['followers_count'] = len(user.get('followers', []))
    user['following_count'] = len(user.get('following', []))
    
    return user

@api_router.post("/users/{user_id}/follow")
async def follow_user(user_id: str, current_user: dict = Depends(get_current_user)):
    if user_id == current_user['id']:
        raise HTTPException(status_code=400, detail='Cannot follow yourself')
    
    target_user = await db.users.find_one({'id': user_id})
    if not target_user:
        raise HTTPException(status_code=404, detail='User not found')
    
    # Add to following/followers
    await db.users.update_one({'id': current_user['id']}, {'$addToSet': {'following': user_id}})
    await db.users.update_one({'id': user_id}, {'$addToSet': {'followers': current_user['id']}})
    
    return {'message': 'Followed successfully'}

@api_router.delete("/users/{user_id}/follow")
async def unfollow_user(user_id: str, current_user: dict = Depends(get_current_user)):
    await db.users.update_one({'id': current_user['id']}, {'$pull': {'following': user_id}})
    await db.users.update_one({'id': user_id}, {'$pull': {'followers': current_user['id']}})
    return {'message': 'Unfollowed successfully'}

# ================== SERVER ENDPOINTS ==================

@api_router.post("/servers")
async def create_server(server_data: ServerCreate, current_user: dict = Depends(get_current_user)):
    server_id = str(uuid.uuid4())
    invite_code = str(uuid.uuid4())[:8]
    
    server_doc = {
        'id': server_id,
        'name': server_data.name,
        'icon': server_data.icon or f"https://api.dicebear.com/7.x/initials/svg?seed={server_data.name}",
        'banner': None,
        'description': server_data.description,
        'owner_id': current_user['id'],
        'members': [current_user['id']],
        'invite_code': invite_code,
        'boost_count': 0,
        'created_at': datetime.now(timezone.utc).isoformat()
    }
    
    await db.servers.insert_one(server_doc)
    await db.users.update_one({'id': current_user['id']}, {'$push': {'servers': server_id}})
    
    # Create default channels
    channels = [
        {'id': str(uuid.uuid4()), 'name': 'general', 'channel_type': 'text', 'server_id': server_id, 'category_id': None, 'created_at': datetime.now(timezone.utc).isoformat()},
        {'id': str(uuid.uuid4()), 'name': 'General Voice', 'channel_type': 'voice', 'server_id': server_id, 'category_id': None, 'created_at': datetime.now(timezone.utc).isoformat()}
    ]
    await db.channels.insert_many(channels)
    
    server_doc['member_count'] = 1
    return {k: v for k, v in server_doc.items() if k != '_id' and k != 'members'}

@api_router.get("/servers")
async def get_user_servers(current_user: dict = Depends(get_current_user)):
    servers = await db.servers.find({'members': current_user['id']}, {'_id': 0}).to_list(100)
    for server in servers:
        server['member_count'] = len(server.get('members', []))
        server.pop('members', None)
    return servers

@api_router.get("/servers/{server_id}")
async def get_server(server_id: str, current_user: dict = Depends(get_current_user)):
    server = await db.servers.find_one({'id': server_id}, {'_id': 0})
    if not server:
        raise HTTPException(status_code=404, detail='Server not found')
    server['member_count'] = len(server.get('members', []))
    return server

@api_router.post("/servers/join/{invite_code}")
async def join_server(invite_code: str, current_user: dict = Depends(get_current_user)):
    server = await db.servers.find_one({'invite_code': invite_code})
    if not server:
        raise HTTPException(status_code=404, detail='Invalid invite code')
    
    if current_user['id'] in server.get('members', []):
        raise HTTPException(status_code=400, detail='Already a member')
    
    await db.servers.update_one({'id': server['id']}, {'$push': {'members': current_user['id']}})
    await db.users.update_one({'id': current_user['id']}, {'$push': {'servers': server['id']}})
    
    return {'message': 'Joined server successfully', 'server_id': server['id']}

@api_router.get("/servers/{server_id}/members")
async def get_server_members(server_id: str, current_user: dict = Depends(get_current_user)):
    server = await db.servers.find_one({'id': server_id})
    if not server:
        raise HTTPException(status_code=404, detail='Server not found')
    
    members = await db.users.find({'id': {'$in': server.get('members', [])}}, {'_id': 0, 'password': 0}).to_list(100)
    return members

# ================== CHANNEL ENDPOINTS ==================

@api_router.post("/channels")
async def create_channel(channel_data: ChannelCreate, current_user: dict = Depends(get_current_user)):
    server = await db.servers.find_one({'id': channel_data.server_id, 'owner_id': current_user['id']})
    if not server:
        raise HTTPException(status_code=403, detail='Not authorized to create channels')
    
    channel_doc = {
        'id': str(uuid.uuid4()),
        'name': channel_data.name.lower().replace(' ', '-'),
        'channel_type': channel_data.channel_type,
        'server_id': channel_data.server_id,
        'category_id': channel_data.category_id,
        'created_at': datetime.now(timezone.utc).isoformat()
    }
    
    await db.channels.insert_one(channel_doc)
    return {k: v for k, v in channel_doc.items() if k != '_id'}

@api_router.get("/servers/{server_id}/channels")
async def get_server_channels(server_id: str, current_user: dict = Depends(get_current_user)):
    channels = await db.channels.find({'server_id': server_id}, {'_id': 0}).to_list(100)
    return channels

# ================== MESSAGE ENDPOINTS ==================

@api_router.post("/messages")
async def create_message(message_data: MessageCreate, current_user: dict = Depends(get_current_user)):
    channel = await db.channels.find_one({'id': message_data.channel_id})
    if not channel:
        raise HTTPException(status_code=404, detail='Channel not found')
    
    message_doc = {
        'id': str(uuid.uuid4()),
        'content': message_data.content,
        'channel_id': message_data.channel_id,
        'author_id': current_user['id'],
        'attachments': message_data.attachments or [],
        'reactions': {},
        'created_at': datetime.now(timezone.utc).isoformat()
    }
    
    await db.messages.insert_one(message_doc)
    
    message_response = {k: v for k, v in message_doc.items() if k != '_id'}
    message_response['author'] = {
        'id': current_user['id'],
        'username': current_user['username'],
        'avatar': current_user.get('avatar'),
        'discriminator': current_user.get('discriminator')
    }
    
    return message_response

@api_router.get("/channels/{channel_id}/messages")
async def get_channel_messages(channel_id: str, limit: int = 50, current_user: dict = Depends(get_current_user)):
    messages = await db.messages.find({'channel_id': channel_id}, {'_id': 0}).sort('created_at', -1).limit(limit).to_list(limit)
    
    for message in messages:
        author = await db.users.find_one({'id': message['author_id']}, {'_id': 0, 'password': 0})
        if author:
            message['author'] = {'id': author['id'], 'username': author['username'], 'avatar': author.get('avatar'), 'discriminator': author.get('discriminator')}
    
    return list(reversed(messages))

@api_router.post("/messages/{message_id}/reactions/{emoji}")
async def add_reaction(message_id: str, emoji: str, current_user: dict = Depends(get_current_user)):
    message = await db.messages.find_one({'id': message_id})
    if not message:
        raise HTTPException(status_code=404, detail='Message not found')
    
    reactions = message.get('reactions', {})
    if emoji not in reactions:
        reactions[emoji] = []
    if current_user['id'] not in reactions[emoji]:
        reactions[emoji].append(current_user['id'])
    
    await db.messages.update_one({'id': message_id}, {'$set': {'reactions': reactions}})
    return {'message': 'Reaction added'}

# ================== DM ENDPOINTS ==================

@api_router.post("/dms")
async def create_dm(dm_data: DMCreate, current_user: dict = Depends(get_current_user)):
    existing = await db.dms.find_one({
        '$or': [
            {'participants': [current_user['id'], dm_data.recipient_id]},
            {'participants': [dm_data.recipient_id, current_user['id']]}
        ]
    })
    
    if existing:
        return {k: v for k, v in existing.items() if k != '_id'}
    
    dm_doc = {
        'id': str(uuid.uuid4()),
        'participants': [current_user['id'], dm_data.recipient_id],
        'created_at': datetime.now(timezone.utc).isoformat()
    }
    
    await db.dms.insert_one(dm_doc)
    return {k: v for k, v in dm_doc.items() if k != '_id'}

@api_router.get("/dms")
async def get_user_dms(current_user: dict = Depends(get_current_user)):
    dms = await db.dms.find({'participants': current_user['id']}, {'_id': 0}).to_list(100)
    
    for dm in dms:
        other_ids = [p for p in dm['participants'] if p != current_user['id']]
        others = await db.users.find({'id': {'$in': other_ids}}, {'_id': 0, 'password': 0}).to_list(10)
        dm['participants_info'] = others
        
        last_msg = await db.dm_messages.find({'dm_id': dm['id']}, {'_id': 0}).sort('created_at', -1).limit(1).to_list(1)
        dm['last_message'] = last_msg[0] if last_msg else None
    
    return dms

@api_router.post("/dms/messages")
async def send_dm_message(message_data: DMMessageCreate, current_user: dict = Depends(get_current_user)):
    dm = await db.dms.find_one({'id': message_data.dm_id, 'participants': current_user['id']})
    if not dm:
        raise HTTPException(status_code=404, detail='DM not found')
    
    message_doc = {
        'id': str(uuid.uuid4()),
        'content': message_data.content,
        'dm_id': message_data.dm_id,
        'author_id': current_user['id'],
        'created_at': datetime.now(timezone.utc).isoformat()
    }
    
    await db.dm_messages.insert_one(message_doc)
    
    message_response = {k: v for k, v in message_doc.items() if k != '_id'}
    message_response['author'] = {'id': current_user['id'], 'username': current_user['username'], 'avatar': current_user.get('avatar')}
    
    return message_response

@api_router.get("/dms/{dm_id}/messages")
async def get_dm_messages(dm_id: str, limit: int = 50, current_user: dict = Depends(get_current_user)):
    messages = await db.dm_messages.find({'dm_id': dm_id}, {'_id': 0}).sort('created_at', -1).limit(limit).to_list(limit)
    
    for message in messages:
        author = await db.users.find_one({'id': message['author_id']}, {'_id': 0, 'password': 0})
        if author:
            message['author'] = {'id': author['id'], 'username': author['username'], 'avatar': author.get('avatar')}
    
    return list(reversed(messages))

# ================== REELS ENDPOINTS ==================

@api_router.post("/reels")
async def create_reel(reel_data: ReelCreate, current_user: dict = Depends(get_current_user)):
    reel_doc = {
        'id': str(uuid.uuid4()),
        'title': reel_data.title,
        'description': reel_data.description,
        'video_url': reel_data.video_url,
        'thumbnail_url': reel_data.thumbnail_url,
        'author_id': current_user['id'],
        'likes': [],
        'views': 0,
        'comments_count': 0,
        'created_at': datetime.now(timezone.utc).isoformat()
    }
    
    await db.reels.insert_one(reel_doc)
    
    reel_response = {k: v for k, v in reel_doc.items() if k != '_id'}
    reel_response['author'] = {'id': current_user['id'], 'username': current_user['username'], 'avatar': current_user.get('avatar')}
    reel_response['likes_count'] = 0
    reel_response['is_liked'] = False
    
    return reel_response

@api_router.get("/reels")
async def get_reels(limit: int = 20, skip: int = 0, current_user: dict = Depends(get_current_user)):
    reels = await db.reels.find({}, {'_id': 0}).sort('created_at', -1).skip(skip).limit(limit).to_list(limit)
    
    for reel in reels:
        author = await db.users.find_one({'id': reel['author_id']}, {'_id': 0, 'password': 0})
        if author:
            reel['author'] = {'id': author['id'], 'username': author['username'], 'avatar': author.get('avatar')}
        reel['likes_count'] = len(reel.get('likes', []))
        reel['is_liked'] = current_user['id'] in reel.get('likes', [])
    
    return reels

@api_router.get("/reels/{reel_id}")
async def get_reel(reel_id: str, current_user: dict = Depends(get_current_user)):
    reel = await db.reels.find_one({'id': reel_id}, {'_id': 0})
    if not reel:
        raise HTTPException(status_code=404, detail='Reel not found')
    
    # Increment views
    await db.reels.update_one({'id': reel_id}, {'$inc': {'views': 1}})
    
    author = await db.users.find_one({'id': reel['author_id']}, {'_id': 0, 'password': 0})
    if author:
        reel['author'] = {'id': author['id'], 'username': author['username'], 'avatar': author.get('avatar')}
    reel['likes_count'] = len(reel.get('likes', []))
    reel['is_liked'] = current_user['id'] in reel.get('likes', [])
    
    return reel

@api_router.post("/reels/{reel_id}/like")
async def like_reel(reel_id: str, current_user: dict = Depends(get_current_user)):
    reel = await db.reels.find_one({'id': reel_id})
    if not reel:
        raise HTTPException(status_code=404, detail='Reel not found')
    
    if current_user['id'] in reel.get('likes', []):
        await db.reels.update_one({'id': reel_id}, {'$pull': {'likes': current_user['id']}})
        return {'liked': False}
    else:
        await db.reels.update_one({'id': reel_id}, {'$push': {'likes': current_user['id']}})
        return {'liked': True}

@api_router.get("/reels/{reel_id}/comments")
async def get_reel_comments(reel_id: str, current_user: dict = Depends(get_current_user)):
    comments = await db.reel_comments.find({'reel_id': reel_id}, {'_id': 0}).sort('created_at', -1).to_list(100)
    
    for comment in comments:
        author = await db.users.find_one({'id': comment['author_id']}, {'_id': 0, 'password': 0})
        if author:
            comment['author'] = {'id': author['id'], 'username': author['username'], 'avatar': author.get('avatar')}
    
    return comments

@api_router.post("/reels/{reel_id}/comments")
async def add_reel_comment(reel_id: str, comment_data: CommentCreate, current_user: dict = Depends(get_current_user)):
    reel = await db.reels.find_one({'id': reel_id})
    if not reel:
        raise HTTPException(status_code=404, detail='Reel not found')
    
    comment_doc = {
        'id': str(uuid.uuid4()),
        'content': comment_data.content,
        'reel_id': reel_id,
        'author_id': current_user['id'],
        'created_at': datetime.now(timezone.utc).isoformat()
    }
    
    await db.reel_comments.insert_one(comment_doc)
    await db.reels.update_one({'id': reel_id}, {'$inc': {'comments_count': 1}})
    
    comment_response = {k: v for k, v in comment_doc.items() if k != '_id'}
    comment_response['author'] = {'id': current_user['id'], 'username': current_user['username'], 'avatar': current_user.get('avatar')}
    
    return comment_response

# ================== FORUM ENDPOINTS ==================

@api_router.get("/forum/categories")
async def get_forum_categories(current_user: dict = Depends(get_current_user)):
    categories = await db.forum_categories.find({}, {'_id': 0}).to_list(50)
    
    for cat in categories:
        cat['posts_count'] = await db.forum_posts.count_documents({'category_id': cat['id']})
        latest = await db.forum_posts.find({'category_id': cat['id']}, {'_id': 0}).sort('created_at', -1).limit(1).to_list(1)
        cat['latest_post'] = latest[0] if latest else None
    
    return categories

@api_router.post("/forum/categories")
async def create_forum_category(category_data: ForumCategoryCreate, current_user: dict = Depends(get_current_user)):
    category_doc = {
        'id': str(uuid.uuid4()),
        'name': category_data.name,
        'description': category_data.description,
        'color': category_data.color,
        'icon': category_data.icon,
        'created_at': datetime.now(timezone.utc).isoformat()
    }
    
    await db.forum_categories.insert_one(category_doc)
    return {k: v for k, v in category_doc.items() if k != '_id'}

@api_router.get("/forum/posts")
async def get_forum_posts(category_id: Optional[str] = None, limit: int = 20, skip: int = 0, current_user: dict = Depends(get_current_user)):
    query = {'category_id': category_id} if category_id else {}
    posts = await db.forum_posts.find(query, {'_id': 0}).sort('created_at', -1).skip(skip).limit(limit).to_list(limit)
    
    for post in posts:
        author = await db.users.find_one({'id': post['author_id']}, {'_id': 0, 'password': 0})
        if author:
            post['author'] = {'id': author['id'], 'username': author['username'], 'avatar': author.get('avatar')}
        post['replies_count'] = await db.forum_replies.count_documents({'post_id': post['id']})
    
    return posts

@api_router.post("/forum/posts")
async def create_forum_post(post_data: ForumPostCreate, current_user: dict = Depends(get_current_user)):
    post_doc = {
        'id': str(uuid.uuid4()),
        'title': post_data.title,
        'content': post_data.content,
        'category_id': post_data.category_id,
        'author_id': current_user['id'],
        'attachments': post_data.attachments,
        'views': 0,
        'likes': [],
        'created_at': datetime.now(timezone.utc).isoformat()
    }
    
    await db.forum_posts.insert_one(post_doc)
    
    post_response = {k: v for k, v in post_doc.items() if k != '_id'}
    post_response['author'] = {'id': current_user['id'], 'username': current_user['username'], 'avatar': current_user.get('avatar')}
    
    return post_response

@api_router.get("/forum/posts/{post_id}")
async def get_forum_post(post_id: str, current_user: dict = Depends(get_current_user)):
    post = await db.forum_posts.find_one({'id': post_id}, {'_id': 0})
    if not post:
        raise HTTPException(status_code=404, detail='Post not found')
    
    await db.forum_posts.update_one({'id': post_id}, {'$inc': {'views': 1}})
    
    author = await db.users.find_one({'id': post['author_id']}, {'_id': 0, 'password': 0})
    if author:
        post['author'] = {'id': author['id'], 'username': author['username'], 'avatar': author.get('avatar')}
    
    return post

@api_router.get("/forum/posts/{post_id}/replies")
async def get_post_replies(post_id: str, current_user: dict = Depends(get_current_user)):
    replies = await db.forum_replies.find({'post_id': post_id}, {'_id': 0}).sort('created_at', 1).to_list(100)
    
    for reply in replies:
        author = await db.users.find_one({'id': reply['author_id']}, {'_id': 0, 'password': 0})
        if author:
            reply['author'] = {'id': author['id'], 'username': author['username'], 'avatar': author.get('avatar')}
    
    return replies

@api_router.post("/forum/posts/{post_id}/replies")
async def create_post_reply(post_id: str, reply_data: ForumReplyCreate, current_user: dict = Depends(get_current_user)):
    reply_doc = {
        'id': str(uuid.uuid4()),
        'content': reply_data.content,
        'post_id': post_id,
        'author_id': current_user['id'],
        'attachments': reply_data.attachments,
        'created_at': datetime.now(timezone.utc).isoformat()
    }
    
    await db.forum_replies.insert_one(reply_doc)
    
    reply_response = {k: v for k, v in reply_doc.items() if k != '_id'}
    reply_response['author'] = {'id': current_user['id'], 'username': current_user['username'], 'avatar': current_user.get('avatar')}
    
    return reply_response

# ================== SALES/MARKETPLACE ENDPOINTS ==================

@api_router.get("/marketplace/products")
async def get_products(category: Optional[str] = None, limit: int = 20, current_user: dict = Depends(get_current_user)):
    query = {'category': category} if category else {}
    products = await db.products.find(query, {'_id': 0}).sort('created_at', -1).limit(limit).to_list(limit)
    
    for product in products:
        seller = await db.users.find_one({'id': product['seller_id']}, {'_id': 0, 'password': 0})
        if seller:
            product['seller'] = {'id': seller['id'], 'username': seller['username'], 'avatar': seller.get('avatar')}
    
    return products

@api_router.post("/marketplace/products")
async def create_product(product_data: ProductCreate, current_user: dict = Depends(get_current_user)):
    product_doc = {
        'id': str(uuid.uuid4()),
        'name': product_data.name,
        'description': product_data.description,
        'price': product_data.price,
        'category': product_data.category,
        'images': product_data.images,
        'file_url': product_data.file_url,
        'seller_id': current_user['id'],
        'sales_count': 0,
        'created_at': datetime.now(timezone.utc).isoformat()
    }
    
    await db.products.insert_one(product_doc)
    
    product_response = {k: v for k, v in product_doc.items() if k != '_id'}
    product_response['seller'] = {'id': current_user['id'], 'username': current_user['username'], 'avatar': current_user.get('avatar')}
    
    return product_response

@api_router.get("/marketplace/products/{product_id}")
async def get_product(product_id: str, current_user: dict = Depends(get_current_user)):
    product = await db.products.find_one({'id': product_id}, {'_id': 0})
    if not product:
        raise HTTPException(status_code=404, detail='Product not found')
    
    seller = await db.users.find_one({'id': product['seller_id']}, {'_id': 0, 'password': 0})
    if seller:
        product['seller'] = {'id': seller['id'], 'username': seller['username'], 'avatar': seller.get('avatar')}
    
    return product

# ================== STUDIO ENDPOINTS ==================

@api_router.get("/studio/projects")
async def get_studio_projects(current_user: dict = Depends(get_current_user)):
    projects = await db.studio_projects.find({'owner_id': current_user['id']}, {'_id': 0}).sort('updated_at', -1).to_list(50)
    return projects

@api_router.post("/studio/projects")
async def create_studio_project(project_data: StudioProjectCreate, current_user: dict = Depends(get_current_user)):
    project_doc = {
        'id': str(uuid.uuid4()),
        'name': project_data.name,
        'description': project_data.description,
        'thumbnail': project_data.thumbnail or 'https://via.placeholder.com/300x200?text=Project',
        'project_type': project_data.project_type,
        'owner_id': current_user['id'],
        'collaborators': [],
        'is_public': False,
        'plays': 0,
        'likes': 0,
        'created_at': datetime.now(timezone.utc).isoformat(),
        'updated_at': datetime.now(timezone.utc).isoformat()
    }
    
    await db.studio_projects.insert_one(project_doc)
    return {k: v for k, v in project_doc.items() if k != '_id'}

@api_router.get("/studio/templates")
async def get_studio_templates(current_user: dict = Depends(get_current_user)):
    templates = [
        {'id': '1', 'name': 'Obby Template', 'description': 'Classic obstacle course', 'thumbnail': 'https://via.placeholder.com/300x200?text=Obby', 'category': 'game'},
        {'id': '2', 'name': 'Tycoon Base', 'description': 'Build your empire', 'thumbnail': 'https://via.placeholder.com/300x200?text=Tycoon', 'category': 'game'},
        {'id': '3', 'name': 'Simulator Kit', 'description': 'Click simulator starter', 'thumbnail': 'https://via.placeholder.com/300x200?text=Simulator', 'category': 'game'},
        {'id': '4', 'name': 'Roleplay Map', 'description': 'Town roleplay base', 'thumbnail': 'https://via.placeholder.com/300x200?text=Roleplay', 'category': 'game'},
    ]
    return templates

# ================== FILE UPLOAD ==================

@api_router.post("/upload/{upload_type}")
async def upload_file(upload_type: str, file: UploadFile = File(...), current_user: dict = Depends(get_current_user)):
    if upload_type not in ['avatars', 'videos', 'images', 'files']:
        raise HTTPException(status_code=400, detail='Invalid upload type')
    
    # Upload to Cloudinary
    try:
        # Determine resource type
        resource_type = "auto"
        if upload_type == "images" or upload_type == "avatars":
            resource_type = "image"
        elif upload_type == "videos":
            resource_type = "video"
            
        # Read file content
        content = await file.read()
        
        # Upload
        result = cloudinary.uploader.upload(
            content, 
            folder=f"notfox/{upload_type}", 
            resource_type=resource_type
        )
        
        file_url = result.get("secure_url")
        return {'url': file_url, 'filename': file.filename}
        
    except Exception as e:
        logger.error(f"Upload failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")

@api_router.get("/files/{upload_type}/{filename}")
async def get_file(upload_type: str, filename: str):
    # Deprecated: Files are now served directly from Cloudinary
    # This endpoint remains for backward compatibility if needed, but won't work on Vercel for new uploads
    pass

# ================== SEARCH ==================

@api_router.get("/search/users")
async def search_users(q: str, current_user: dict = Depends(get_current_user)):
    users = await db.users.find({'username': {'$regex': q, '$options': 'i'}}, {'_id': 0, 'password': 0}).limit(20).to_list(20)
    return users

@api_router.get("/discover/servers")
async def discover_servers(current_user: dict = Depends(get_current_user)):
    servers = await db.servers.find({}, {'_id': 0}).limit(50).to_list(50)
    for server in servers:
        server['member_count'] = len(server.get('members', []))
        server.pop('members', None)
    return servers

# ================== SEED DEFAULT DATA ==================

@api_router.post("/seed/forum")
async def seed_forum_data(current_user: dict = Depends(get_current_user)):
    # Check if categories already exist
    existing = await db.forum_categories.count_documents({})
    if existing > 0:
        return {'message': 'Forum already seeded'}
    
    categories = [
        {'id': str(uuid.uuid4()), 'name': 'Updates', 'description': 'Product announcements, news, and updates', 'color': '#ef4444', 'icon': 'megaphone', 'created_at': datetime.now(timezone.utc).isoformat()},
        {'id': str(uuid.uuid4()), 'name': 'Help and Feedback', 'description': 'Get help and share feedback', 'color': '#3b82f6', 'icon': 'help-circle', 'created_at': datetime.now(timezone.utc).isoformat()},
        {'id': str(uuid.uuid4()), 'name': 'Creations', 'description': 'Share your creations', 'color': '#22c55e', 'icon': 'sparkles', 'created_at': datetime.now(timezone.utc).isoformat()},
        {'id': str(uuid.uuid4()), 'name': 'Resources', 'description': 'Tutorials and resources', 'color': '#f59e0b', 'icon': 'book', 'created_at': datetime.now(timezone.utc).isoformat()},
        {'id': str(uuid.uuid4()), 'name': 'Discussion', 'description': 'General discussion', 'color': '#8b5cf6', 'icon': 'message-circle', 'created_at': datetime.now(timezone.utc).isoformat()},
    ]
    
    await db.forum_categories.insert_many(categories)
    return {'message': 'Forum seeded successfully', 'categories': len(categories)}

# ================== APP SETUP ==================

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
