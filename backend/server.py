from fastapi import FastAPI, APIRouter, HTTPException, Depends, UploadFile, File, WebSocket, WebSocketDisconnect
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
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
import socketio
import json
import base64
import aiofiles

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Settings
JWT_SECRET = os.environ.get('JWT_SECRET', 'echosphere-super-secret-key-2024')
JWT_ALGORITHM = 'HS256'
JWT_EXPIRATION_HOURS = 72

# Create the main FastAPI app
app = FastAPI(title="EchoSphere API")

# Socket.IO server
sio = socketio.AsyncServer(async_mode='asgi', cors_allowed_origins='*')
socket_app = socketio.ASGIApp(sio, app)

# Create API router
api_router = APIRouter(prefix="/api")

# Security
security = HTTPBearer()

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# File upload directory
UPLOAD_DIR = ROOT_DIR / 'uploads'
UPLOAD_DIR.mkdir(exist_ok=True)

# ================== MODELS ==================

class UserBase(BaseModel):
    model_config = ConfigDict(extra="ignore")
    username: str
    email: str
    avatar: Optional[str] = None
    banner: Optional[str] = None
    bio: Optional[str] = ""
    status: str = "online"
    is_nitro: bool = False
    discriminator: str = Field(default_factory=lambda: str(uuid.uuid4().int)[:4])

class UserCreate(BaseModel):
    username: str
    email: str
    password: str
    avatar: Optional[str] = None

class UserLogin(BaseModel):
    email: str
    password: str

class UserResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    username: str
    email: str
    avatar: Optional[str] = None
    banner: Optional[str] = None
    bio: Optional[str] = ""
    status: str = "online"
    is_nitro: bool = False
    discriminator: str
    created_at: str

class ServerCreate(BaseModel):
    name: str
    icon: Optional[str] = None
    banner: Optional[str] = None
    description: Optional[str] = ""
    is_private: bool = False

class ServerResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    name: str
    icon: Optional[str] = None
    banner: Optional[str] = None
    description: Optional[str] = ""
    owner_id: str
    is_private: bool = False
    boost_count: int = 0
    invite_code: str
    created_at: str
    member_count: int = 0

class ChannelCreate(BaseModel):
    name: str
    channel_type: str = "text"  # text, voice, video, announcement
    server_id: str
    category_id: Optional[str] = None
    is_private: bool = False

class ChannelResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    name: str
    channel_type: str
    server_id: str
    category_id: Optional[str] = None
    is_private: bool = False
    created_at: str

class CategoryCreate(BaseModel):
    name: str
    server_id: str

class CategoryResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    name: str
    server_id: str
    position: int = 0
    created_at: str

class MessageCreate(BaseModel):
    content: str
    channel_id: str
    attachments: Optional[List[str]] = []

class MessageResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    content: str
    channel_id: str
    author_id: str
    author: Optional[Dict[str, Any]] = None
    attachments: List[str] = []
    reactions: Dict[str, List[str]] = {}
    is_pinned: bool = False
    edited_at: Optional[str] = None
    created_at: str

class DMCreate(BaseModel):
    recipient_id: str

class DMMessageCreate(BaseModel):
    content: str
    dm_id: str
    attachments: Optional[List[str]] = []

class RoleCreate(BaseModel):
    name: str
    server_id: str
    color: str = "#ffffff"
    permissions: List[str] = []

class RoleResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    name: str
    server_id: str
    color: str
    permissions: List[str] = []
    position: int = 0
    created_at: str

class ServerEventCreate(BaseModel):
    title: str
    description: str
    server_id: str
    channel_id: Optional[str] = None
    start_time: str
    end_time: Optional[str] = None

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
        'avatar': user_data.avatar or f"https://api.dicebear.com/7.x/avataaars/svg?seed={user_data.username}",
        'banner': None,
        'bio': '',
        'status': 'online',
        'is_nitro': False,
        'discriminator': discriminator,
        'servers': [],
        'friends': [],
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

@api_router.get("/auth/me", response_model=UserResponse)
async def get_me(current_user: dict = Depends(get_current_user)):
    return current_user

@api_router.put("/auth/profile")
async def update_profile(updates: dict, current_user: dict = Depends(get_current_user)):
    allowed_fields = ['username', 'avatar', 'banner', 'bio', 'status']
    update_data = {k: v for k, v in updates.items() if k in allowed_fields}
    
    if update_data:
        await db.users.update_one({'id': current_user['id']}, {'$set': update_data})
    
    updated_user = await db.users.find_one({'id': current_user['id']}, {'_id': 0, 'password': 0})
    return updated_user

# ================== SERVER ENDPOINTS ==================

@api_router.post("/servers", response_model=ServerResponse)
async def create_server(server_data: ServerCreate, current_user: dict = Depends(get_current_user)):
    server_id = str(uuid.uuid4())
    invite_code = str(uuid.uuid4())[:8]
    
    server_doc = {
        'id': server_id,
        'name': server_data.name,
        'icon': server_data.icon or f"https://api.dicebear.com/7.x/initials/svg?seed={server_data.name}",
        'banner': server_data.banner,
        'description': server_data.description,
        'owner_id': current_user['id'],
        'is_private': server_data.is_private,
        'boost_count': 0,
        'invite_code': invite_code,
        'members': [current_user['id']],
        'created_at': datetime.now(timezone.utc).isoformat()
    }
    
    await db.servers.insert_one(server_doc)
    await db.users.update_one({'id': current_user['id']}, {'$push': {'servers': server_id}})
    
    # Create default channels
    general_channel = {
        'id': str(uuid.uuid4()),
        'name': 'general',
        'channel_type': 'text',
        'server_id': server_id,
        'category_id': None,
        'is_private': False,
        'created_at': datetime.now(timezone.utc).isoformat()
    }
    voice_channel = {
        'id': str(uuid.uuid4()),
        'name': 'General Voice',
        'channel_type': 'voice',
        'server_id': server_id,
        'category_id': None,
        'is_private': False,
        'created_at': datetime.now(timezone.utc).isoformat()
    }
    
    await db.channels.insert_many([general_channel, voice_channel])
    
    # Create default role
    default_role = {
        'id': str(uuid.uuid4()),
        'name': '@everyone',
        'server_id': server_id,
        'color': '#99aab5',
        'permissions': ['read_messages', 'send_messages', 'connect_voice'],
        'position': 0,
        'created_at': datetime.now(timezone.utc).isoformat()
    }
    await db.roles.insert_one(default_role)
    
    server_doc['member_count'] = 1
    return {k: v for k, v in server_doc.items() if k != '_id' and k != 'members'}

@api_router.get("/servers", response_model=List[ServerResponse])
async def get_user_servers(current_user: dict = Depends(get_current_user)):
    servers = await db.servers.find({'members': current_user['id']}, {'_id': 0}).to_list(100)
    for server in servers:
        server['member_count'] = len(server.get('members', []))
        server.pop('members', None)
    return servers

@api_router.get("/servers/{server_id}", response_model=ServerResponse)
async def get_server(server_id: str, current_user: dict = Depends(get_current_user)):
    server = await db.servers.find_one({'id': server_id, 'members': current_user['id']}, {'_id': 0})
    if not server:
        raise HTTPException(status_code=404, detail='Server not found')
    server['member_count'] = len(server.get('members', []))
    server.pop('members', None)
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
    server = await db.servers.find_one({'id': server_id, 'members': current_user['id']})
    if not server:
        raise HTTPException(status_code=404, detail='Server not found')
    
    members = await db.users.find(
        {'id': {'$in': server.get('members', [])}},
        {'_id': 0, 'password': 0}
    ).to_list(100)
    return members

# ================== CHANNEL ENDPOINTS ==================

@api_router.post("/channels", response_model=ChannelResponse)
async def create_channel(channel_data: ChannelCreate, current_user: dict = Depends(get_current_user)):
    server = await db.servers.find_one({'id': channel_data.server_id, 'owner_id': current_user['id']})
    if not server:
        raise HTTPException(status_code=403, detail='Not authorized')
    
    channel_doc = {
        'id': str(uuid.uuid4()),
        'name': channel_data.name,
        'channel_type': channel_data.channel_type,
        'server_id': channel_data.server_id,
        'category_id': channel_data.category_id,
        'is_private': channel_data.is_private,
        'created_at': datetime.now(timezone.utc).isoformat()
    }
    
    await db.channels.insert_one(channel_doc)
    return {k: v for k, v in channel_doc.items() if k != '_id'}

@api_router.get("/servers/{server_id}/channels", response_model=List[ChannelResponse])
async def get_server_channels(server_id: str, current_user: dict = Depends(get_current_user)):
    server = await db.servers.find_one({'id': server_id, 'members': current_user['id']})
    if not server:
        raise HTTPException(status_code=404, detail='Server not found')
    
    channels = await db.channels.find({'server_id': server_id}, {'_id': 0}).to_list(100)
    return channels

@api_router.post("/categories", response_model=CategoryResponse)
async def create_category(category_data: CategoryCreate, current_user: dict = Depends(get_current_user)):
    server = await db.servers.find_one({'id': category_data.server_id, 'owner_id': current_user['id']})
    if not server:
        raise HTTPException(status_code=403, detail='Not authorized')
    
    category_count = await db.categories.count_documents({'server_id': category_data.server_id})
    
    category_doc = {
        'id': str(uuid.uuid4()),
        'name': category_data.name,
        'server_id': category_data.server_id,
        'position': category_count,
        'created_at': datetime.now(timezone.utc).isoformat()
    }
    
    await db.categories.insert_one(category_doc)
    return {k: v for k, v in category_doc.items() if k != '_id'}

@api_router.get("/servers/{server_id}/categories", response_model=List[CategoryResponse])
async def get_server_categories(server_id: str, current_user: dict = Depends(get_current_user)):
    categories = await db.categories.find({'server_id': server_id}, {'_id': 0}).to_list(50)
    return categories

# ================== MESSAGE ENDPOINTS ==================

@api_router.post("/messages", response_model=MessageResponse)
async def create_message(message_data: MessageCreate, current_user: dict = Depends(get_current_user)):
    channel = await db.channels.find_one({'id': message_data.channel_id})
    if not channel:
        raise HTTPException(status_code=404, detail='Channel not found')
    
    server = await db.servers.find_one({'id': channel['server_id'], 'members': current_user['id']})
    if not server:
        raise HTTPException(status_code=403, detail='Not a member of this server')
    
    message_doc = {
        'id': str(uuid.uuid4()),
        'content': message_data.content,
        'channel_id': message_data.channel_id,
        'author_id': current_user['id'],
        'attachments': message_data.attachments or [],
        'reactions': {},
        'is_pinned': False,
        'edited_at': None,
        'created_at': datetime.now(timezone.utc).isoformat()
    }
    
    await db.messages.insert_one(message_doc)
    
    message_response = {k: v for k, v in message_doc.items() if k != '_id'}
    message_response['author'] = {
        'id': current_user['id'],
        'username': current_user['username'],
        'avatar': current_user.get('avatar'),
        'discriminator': current_user.get('discriminator'),
        'is_nitro': current_user.get('is_nitro', False)
    }
    
    # Emit via WebSocket
    await sio.emit('new_message', message_response, room=message_data.channel_id)
    
    return message_response

@api_router.get("/channels/{channel_id}/messages", response_model=List[MessageResponse])
async def get_channel_messages(channel_id: str, limit: int = 50, before: Optional[str] = None, current_user: dict = Depends(get_current_user)):
    channel = await db.channels.find_one({'id': channel_id})
    if not channel:
        raise HTTPException(status_code=404, detail='Channel not found')
    
    query = {'channel_id': channel_id}
    if before:
        query['created_at'] = {'$lt': before}
    
    messages = await db.messages.find(query, {'_id': 0}).sort('created_at', -1).limit(limit).to_list(limit)
    
    # Add author info to each message
    for message in messages:
        author = await db.users.find_one({'id': message['author_id']}, {'_id': 0, 'password': 0})
        if author:
            message['author'] = {
                'id': author['id'],
                'username': author['username'],
                'avatar': author.get('avatar'),
                'discriminator': author.get('discriminator'),
                'is_nitro': author.get('is_nitro', False)
            }
    
    return list(reversed(messages))

@api_router.put("/messages/{message_id}")
async def edit_message(message_id: str, content: dict, current_user: dict = Depends(get_current_user)):
    message = await db.messages.find_one({'id': message_id, 'author_id': current_user['id']})
    if not message:
        raise HTTPException(status_code=404, detail='Message not found or not authorized')
    
    await db.messages.update_one(
        {'id': message_id},
        {'$set': {'content': content.get('content', ''), 'edited_at': datetime.now(timezone.utc).isoformat()}}
    )
    
    updated = await db.messages.find_one({'id': message_id}, {'_id': 0})
    await sio.emit('message_edited', updated, room=message['channel_id'])
    return updated

@api_router.delete("/messages/{message_id}")
async def delete_message(message_id: str, current_user: dict = Depends(get_current_user)):
    message = await db.messages.find_one({'id': message_id, 'author_id': current_user['id']})
    if not message:
        raise HTTPException(status_code=404, detail='Message not found or not authorized')
    
    await db.messages.delete_one({'id': message_id})
    await sio.emit('message_deleted', {'id': message_id, 'channel_id': message['channel_id']}, room=message['channel_id'])
    return {'message': 'Deleted'}

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
    await sio.emit('reaction_added', {'message_id': message_id, 'emoji': emoji, 'user_id': current_user['id']}, room=message['channel_id'])
    return {'message': 'Reaction added'}

@api_router.delete("/messages/{message_id}/reactions/{emoji}")
async def remove_reaction(message_id: str, emoji: str, current_user: dict = Depends(get_current_user)):
    message = await db.messages.find_one({'id': message_id})
    if not message:
        raise HTTPException(status_code=404, detail='Message not found')
    
    reactions = message.get('reactions', {})
    if emoji in reactions and current_user['id'] in reactions[emoji]:
        reactions[emoji].remove(current_user['id'])
        if not reactions[emoji]:
            del reactions[emoji]
    
    await db.messages.update_one({'id': message_id}, {'$set': {'reactions': reactions}})
    await sio.emit('reaction_removed', {'message_id': message_id, 'emoji': emoji, 'user_id': current_user['id']}, room=message['channel_id'])
    return {'message': 'Reaction removed'}

# ================== DM ENDPOINTS ==================

@api_router.post("/dms")
async def create_dm(dm_data: DMCreate, current_user: dict = Depends(get_current_user)):
    recipient = await db.users.find_one({'id': dm_data.recipient_id})
    if not recipient:
        raise HTTPException(status_code=404, detail='User not found')
    
    # Check if DM already exists
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
        'is_group': False,
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
        
        # Get last message
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
        'attachments': message_data.attachments or [],
        'created_at': datetime.now(timezone.utc).isoformat()
    }
    
    await db.dm_messages.insert_one(message_doc)
    
    message_response = {k: v for k, v in message_doc.items() if k != '_id'}
    message_response['author'] = {
        'id': current_user['id'],
        'username': current_user['username'],
        'avatar': current_user.get('avatar'),
        'discriminator': current_user.get('discriminator')
    }
    
    await sio.emit('new_dm_message', message_response, room=f"dm_{message_data.dm_id}")
    return message_response

@api_router.get("/dms/{dm_id}/messages")
async def get_dm_messages(dm_id: str, limit: int = 50, current_user: dict = Depends(get_current_user)):
    dm = await db.dms.find_one({'id': dm_id, 'participants': current_user['id']})
    if not dm:
        raise HTTPException(status_code=404, detail='DM not found')
    
    messages = await db.dm_messages.find({'dm_id': dm_id}, {'_id': 0}).sort('created_at', -1).limit(limit).to_list(limit)
    
    for message in messages:
        author = await db.users.find_one({'id': message['author_id']}, {'_id': 0, 'password': 0})
        if author:
            message['author'] = {
                'id': author['id'],
                'username': author['username'],
                'avatar': author.get('avatar'),
                'discriminator': author.get('discriminator')
            }
    
    return list(reversed(messages))

# ================== ROLE ENDPOINTS ==================

@api_router.post("/roles", response_model=RoleResponse)
async def create_role(role_data: RoleCreate, current_user: dict = Depends(get_current_user)):
    server = await db.servers.find_one({'id': role_data.server_id, 'owner_id': current_user['id']})
    if not server:
        raise HTTPException(status_code=403, detail='Not authorized')
    
    role_count = await db.roles.count_documents({'server_id': role_data.server_id})
    
    role_doc = {
        'id': str(uuid.uuid4()),
        'name': role_data.name,
        'server_id': role_data.server_id,
        'color': role_data.color,
        'permissions': role_data.permissions,
        'position': role_count,
        'created_at': datetime.now(timezone.utc).isoformat()
    }
    
    await db.roles.insert_one(role_doc)
    return {k: v for k, v in role_doc.items() if k != '_id'}

@api_router.get("/servers/{server_id}/roles", response_model=List[RoleResponse])
async def get_server_roles(server_id: str, current_user: dict = Depends(get_current_user)):
    roles = await db.roles.find({'server_id': server_id}, {'_id': 0}).to_list(50)
    return roles

# ================== EVENT ENDPOINTS ==================

@api_router.post("/events")
async def create_event(event_data: ServerEventCreate, current_user: dict = Depends(get_current_user)):
    server = await db.servers.find_one({'id': event_data.server_id, 'owner_id': current_user['id']})
    if not server:
        raise HTTPException(status_code=403, detail='Not authorized')
    
    event_doc = {
        'id': str(uuid.uuid4()),
        'title': event_data.title,
        'description': event_data.description,
        'server_id': event_data.server_id,
        'channel_id': event_data.channel_id,
        'start_time': event_data.start_time,
        'end_time': event_data.end_time,
        'creator_id': current_user['id'],
        'attendees': [current_user['id']],
        'created_at': datetime.now(timezone.utc).isoformat()
    }
    
    await db.events.insert_one(event_doc)
    return {k: v for k, v in event_doc.items() if k != '_id'}

@api_router.get("/servers/{server_id}/events")
async def get_server_events(server_id: str, current_user: dict = Depends(get_current_user)):
    events = await db.events.find({'server_id': server_id}, {'_id': 0}).to_list(50)
    return events

# ================== FILE UPLOAD ==================

@api_router.post("/upload")
async def upload_file(file: UploadFile = File(...), current_user: dict = Depends(get_current_user)):
    file_id = str(uuid.uuid4())
    file_ext = Path(file.filename).suffix if file.filename else ''
    file_path = UPLOAD_DIR / f"{file_id}{file_ext}"
    
    async with aiofiles.open(file_path, 'wb') as f:
        content = await file.read()
        await f.write(content)
    
    file_url = f"/api/files/{file_id}{file_ext}"
    return {'url': file_url, 'filename': file.filename}

@api_router.get("/files/{filename}")
async def get_file(filename: str):
    file_path = UPLOAD_DIR / filename
    if not file_path.exists():
        raise HTTPException(status_code=404, detail='File not found')
    
    from fastapi.responses import FileResponse
    return FileResponse(file_path)

# ================== SEARCH ==================

@api_router.get("/search/messages")
async def search_messages(q: str, server_id: Optional[str] = None, current_user: dict = Depends(get_current_user)):
    query = {'content': {'$regex': q, '$options': 'i'}}
    
    if server_id:
        channels = await db.channels.find({'server_id': server_id}, {'id': 1}).to_list(100)
        channel_ids = [c['id'] for c in channels]
        query['channel_id'] = {'$in': channel_ids}
    
    messages = await db.messages.find(query, {'_id': 0}).limit(50).to_list(50)
    return messages

@api_router.get("/search/users")
async def search_users(q: str, current_user: dict = Depends(get_current_user)):
    users = await db.users.find(
        {'username': {'$regex': q, '$options': 'i'}},
        {'_id': 0, 'password': 0}
    ).limit(20).to_list(20)
    return users

# ================== DISCOVER ==================

@api_router.get("/discover/servers")
async def discover_servers(current_user: dict = Depends(get_current_user)):
    servers = await db.servers.find({'is_private': False}, {'_id': 0}).limit(50).to_list(50)
    for server in servers:
        server['member_count'] = len(server.get('members', []))
        server.pop('members', None)
    return servers

# ================== SOCKET.IO EVENTS ==================

@sio.event
async def connect(sid, environ, auth):
    logger.info(f"Client connected: {sid}")

@sio.event
async def disconnect(sid):
    logger.info(f"Client disconnected: {sid}")

@sio.event
async def join_channel(sid, data):
    channel_id = data.get('channel_id')
    if channel_id:
        await sio.enter_room(sid, channel_id)
        logger.info(f"Client {sid} joined channel {channel_id}")

@sio.event
async def leave_channel(sid, data):
    channel_id = data.get('channel_id')
    if channel_id:
        await sio.leave_room(sid, channel_id)
        logger.info(f"Client {sid} left channel {channel_id}")

@sio.event
async def join_dm(sid, data):
    dm_id = data.get('dm_id')
    if dm_id:
        await sio.enter_room(sid, f"dm_{dm_id}")
        logger.info(f"Client {sid} joined DM {dm_id}")

@sio.event
async def typing_start(sid, data):
    channel_id = data.get('channel_id')
    user = data.get('user')
    if channel_id and user:
        await sio.emit('user_typing', {'user': user, 'channel_id': channel_id}, room=channel_id, skip_sid=sid)

@sio.event
async def typing_stop(sid, data):
    channel_id = data.get('channel_id')
    user = data.get('user')
    if channel_id and user:
        await sio.emit('user_stopped_typing', {'user': user, 'channel_id': channel_id}, room=channel_id, skip_sid=sid)

@sio.event
async def voice_join(sid, data):
    channel_id = data.get('channel_id')
    user = data.get('user')
    if channel_id and user:
        await sio.enter_room(sid, f"voice_{channel_id}")
        await sio.emit('voice_user_joined', {'user': user, 'channel_id': channel_id}, room=f"voice_{channel_id}")

@sio.event
async def voice_leave(sid, data):
    channel_id = data.get('channel_id')
    user = data.get('user')
    if channel_id and user:
        await sio.leave_room(sid, f"voice_{channel_id}")
        await sio.emit('voice_user_left', {'user': user, 'channel_id': channel_id}, room=f"voice_{channel_id}")

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

# Mount Socket.IO
app.mount("/ws", socket_app)
