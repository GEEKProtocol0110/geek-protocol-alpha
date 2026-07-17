from flask import Flask, render_template, request, redirect, url_for, flash, jsonify, session, abort
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
from flask_login import LoginManager, UserMixin, login_user, login_required, logout_user, current_user
from sqlalchemy import inspect, text
import datetime
import os
import random
import time
import math
import json
import re
from enum import Enum
from sample_questions import build_sample_questions

app = Flask(__name__)
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'your-secret-key-here')
app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get('DATABASE_URL', 'sqlite:///geek_protocol.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)
login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = 'login'

# Feature flag to fully disable the Scrabble/Word Challenges game module.
WORD_CHALLENGES_ENABLED = False

DUST_VALUES = {
    'common': 5,
    'uncommon': 20,
    'rare': 80,
    'epic': 300,
    'legendary': 1200
}

CRAFTING_COSTS = {
    'common': 40,
    'uncommon': 150,
    'rare': 500,
    'epic': 1800,
    'legendary': 7200
}

STICKER_GEEK_PRICES = {
    'common': 6.0,
    'uncommon': 14.0,
    'rare': 35.0,
    'epic': 90.0,
    'legendary': 220.0
}

DEFAULT_POINTS_PER_GEEK = 100
DEFAULT_MIN_CONVERSION_POINTS = 100
DEFAULT_EXCHANGE_EXPIRY_HOURS = 72


@app.before_request
def disable_word_challenge_routes():
    """Block all Word Challenges endpoints when the module is disabled."""
    if WORD_CHALLENGES_ENABLED:
        return None

    path = request.path or ''
    if path.startswith('/word_challenges'):
        abort(404)
    if path.startswith('/api/word_challenge'):
        return jsonify({'success': False, 'message': 'Word Challenges is unavailable.'}), 410
    return None

@app.before_request
def sync_runtime_notifications_and_exchange_state():
    expire_exchange_listings()
    push_db_notifications_to_session()

# ==================== WORD CHALLENGE CONSTANTS ====================

# Scrabble letter values for English
LETTER_VALUES = {
    'A': 1, 'B': 3, 'C': 3, 'D': 2, 'E': 1, 'F': 4, 'G': 2, 'H': 4, 'I': 1,
    'J': 8, 'K': 5, 'L': 1, 'M': 3, 'N': 1, 'O': 1, 'P': 3, 'Q': 10, 'R': 1,
    'S': 1, 'T': 1, 'U': 1, 'V': 4, 'W': 4, 'X': 8, 'Y': 4, 'Z': 10
}

# Letter distribution for English Scrabble
LETTER_DISTRIBUTION = {
    'A': 9, 'B': 2, 'C': 2, 'D': 4, 'E': 12, 'F': 2, 'G': 3, 'H': 2, 'I': 9,
    'J': 1, 'K': 1, 'L': 4, 'M': 2, 'N': 6, 'O': 8, 'P': 2, 'Q': 1, 'R': 6,
    'S': 4, 'T': 6, 'U': 4, 'V': 2, 'W': 2, 'X': 1, 'Y': 2, 'Z': 1
}

# Board bonus squares (standard Scrabble board)
BOARD_BONUSES = {
    # Triple Word Score
    (0, 0): 'TWS', (0, 7): 'TWS', (0, 14): 'TWS',
    (7, 0): 'TWS', (7, 7): 'TWS', (7, 14): 'TWS',
    (14, 0): 'TWS', (14, 7): 'TWS', (14, 14): 'TWS',
    
    # Double Word Score
    (1, 1): 'DWS', (2, 2): 'DWS', (3, 3): 'DWS', (4, 4): 'DWS',
    (10, 10): 'DWS', (11, 11): 'DWS', (12, 12): 'DWS', (13, 13): 'DWS',
    (1, 13): 'DWS', (2, 12): 'DWS', (3, 11): 'DWS', (4, 10): 'DWS',
    (13, 1): 'DWS', (12, 2): 'DWS', (11, 3): 'DWS', (10, 4): 'DWS',
    
    # Triple Letter Score
    (1, 5): 'TLS', (1, 9): 'TLS',
    (5, 1): 'TLS', (5, 5): 'TLS', (5, 9): 'TLS', (5, 13): 'TLS',
    (9, 1): 'TLS', (9, 5): 'TLS', (9, 9): 'TLS', (9, 13): 'TLS',
    (13, 5): 'TLS', (13, 9): 'TLS',
    
    # Double Letter Score
    (0, 3): 'DLS', (0, 11): 'DLS',
    (2, 6): 'DLS', (2, 8): 'DLS',
    (3, 0): 'DLS', (3, 7): 'DLS', (3, 14): 'DLS',
    (6, 2): 'DLS', (6, 6): 'DLS', (6, 8): 'DLS', (6, 12): 'DLS',
    (7, 3): 'DLS', (7, 11): 'DLS',
    (8, 2): 'DLS', (8, 6): 'DLS', (8, 8): 'DLS', (8, 12): 'DLS',
    (11, 0): 'DLS', (11, 7): 'DLS', (11, 14): 'DLS',
    (12, 6): 'DLS', (12, 8): 'DLS',
    (14, 3): 'DLS', (14, 11): 'DLS'
}

# English word list (simplified for demo - in production use a proper dictionary)
COMMON_WORDS = [
    'CAT', 'DOG', 'HOUSE', 'CAR', 'TREE', 'BOOK', 'PEN', 'COMPUTER', 'PHONE',
    'WATER', 'FIRE', 'AIR', 'EARTH', 'SUN', 'MOON', 'STAR', 'CLOUD', 'RAIN',
    'HAPPY', 'SAD', 'BIG', 'SMALL', 'FAST', 'SLOW', 'HOT', 'COLD', 'GOOD',
    'BAD', 'LOVE', 'HATE', 'FRIEND', 'FAMILY', 'WORK', 'PLAY', 'CHALLENGE', 'WORD',
    'LETTER', 'BOARD', 'TILE', 'SCORE', 'POINT', 'WIN', 'LOSE', 'TURN', 'TIME',
    'QUIZ', 'GEEK', 'PROTOCOL', 'SMART', 'CLEVER', 'BRAIN', 'MIND', 'THINK',
    'LEARN', 'STUDY', 'KNOWLEDGE', 'WISDOM', 'POWER', 'STRENGTH', 'SPEED'
]

# ==================== DICTIONARY LOADING ====================

def load_dictionary():
    """Load dictionary from file or use default word list"""
    try:
        # Try to load from file first
        with open('dictionary.json', 'r') as f:
            return set(json.load(f))
    except FileNotFoundError:
        print("Dictionary file not found. Using default word list.")
        # Extended default word list
        default_words = [
            'CAT', 'DOG', 'HOUSE', 'CAR', 'TREE', 'BOOK', 'PEN', 'COMPUTER', 'PHONE',
            'WATER', 'FIRE', 'AIR', 'EARTH', 'SUN', 'MOON', 'STAR', 'CLOUD', 'RAIN',
            'HAPPY', 'SAD', 'BIG', 'SMALL', 'FAST', 'SLOW', 'HOT', 'COLD', 'GOOD',
            'BAD', 'LOVE', 'HATE', 'FRIEND', 'FAMILY', 'WORK', 'PLAY', 'CHALLENGE', 'WORD',
            'LETTER', 'BOARD', 'TILE', 'SCORE', 'POINT', 'WIN', 'LOSE', 'TURN', 'TIME',
            'QUIZ', 'GEEK', 'PROTOCOL', 'SMART', 'CLEVER', 'BRAIN', 'MIND', 'THINK',
            'LEARN', 'STUDY', 'KNOWLEDGE', 'WISDOM', 'POWER', 'STRENGTH', 'SPEED',
            'QUICK', 'BROWN', 'FOX', 'JUMPS', 'OVER', 'LAZY', 'DOG', 'HELLO', 'WORLD',
            'PYTHON', 'FLASK', 'CHALLENGE', 'PLAYER', 'BOARD', 'RACK', 'TILES', 'SCRABBLE',
            'ACE', 'KING', 'QUEEN', 'JACK', 'TEN', 'NINE', 'EIGHT', 'SEVEN', 'SIX',
            'FIVE', 'FOUR', 'THREE', 'TWO', 'ONE', 'ZERO', 'PLUS', 'MINUS', 'TIMES',
            'DIVIDE', 'EQUAL', 'MATH', 'SCIENCE', 'HISTORY', 'ART', 'MUSIC', 'DANCE',
            'SING', 'READ', 'WRITE', 'SPEAK', 'LISTEN', 'WATCH', 'SEE', 'HEAR', 'TOUCH',
            'SMELL', 'TASTE', 'FEEL', 'THINK', 'KNOW', 'BELIEVE', 'DREAM', 'HOPE',
            'WISH', 'LOVE', 'HATE', 'LIKE', 'DISLIKE', 'WANT', 'NEED', 'HAVE', 'GET',
            'GIVE', 'TAKE', 'MAKE', 'DO', 'SAY', 'GO', 'COME', 'BE', 'AM', 'IS', 'ARE',
            'WAS', 'WERE', 'WILL', 'CAN', 'COULD', 'SHOULD', 'WOULD', 'MAY', 'MIGHT',
            'MUST', 'SHALL', 'OUGHT', 'NEED', 'DARE', 'USED', 'TO', 'FROM', 'AT', 'IN',
            'ON', 'BY', 'WITH', 'WITHOUT', 'FOR', 'OF', 'ABOUT', 'AGAINST', 'BETWEEN',
            'AMONG', 'DURING', 'BEFORE', 'AFTER', 'ABOVE', 'BELOW', 'UP', 'DOWN',
            'LEFT', 'RIGHT', 'NORTH', 'SOUTH', 'EAST', 'WEST', 'FRONT', 'BACK', 'SIDE',
            'TOP', 'BOTTOM', 'INSIDE', 'OUTSIDE', 'NEAR', 'FAR', 'CLOSE', 'OPEN',
            'BIG', 'SMALL', 'LARGE', 'TINY', 'HUGE', 'GIANT', 'SHORT', 'LONG', 'TALL',
            'WIDE', 'NARROW', 'THICK', 'THIN', 'HEAVY', 'LIGHT', 'HARD', 'SOFT',
            'STRONG', 'WEAK', 'FAST', 'SLOW', 'QUICK', 'SLOW', 'HOT', 'COLD', 'WARM',
            'COOL', 'NEW', 'OLD', 'YOUNG', 'ANCIENT', 'MODERN', 'FRESH', 'STALE',
            'CLEAN', 'DIRTY', 'BRIGHT', 'DARK', 'LIGHT', 'HEAVY', 'DEEP', 'SHALLOW',
            'HIGH', 'LOW', 'LOUD', 'QUIET', 'SMOOTH', 'ROUGH', 'SOFT', 'HARD',
            'SWEET', 'SOUR', 'BITTER', 'SALTY', 'SPICY', 'BLAND', 'RICH', 'POOR',
            'FULL', 'EMPTY', 'ALIVE', 'DEAD', 'LIVING', 'DYING', 'BORN', 'GROWN',
            'YOUNG', 'OLD', 'CHILD', 'ADULT', 'BABY', 'TEEN', 'MAN', 'WOMAN', 'BOY',
            'GIRL', 'PERSON', 'PEOPLE', 'HUMAN', 'ANIMAL', 'PLANT', 'TREE', 'FLOWER',
            'GRASS', 'LEAF', 'ROOT', 'BRANCH', 'TRUNK', 'BARK', 'WOOD', 'FOREST',
            'JUNGLE', 'DESERT', 'MOUNTAIN', 'HILL', 'VALLEY', 'RIVER', 'LAKE', 'OCEAN',
            'SEA', 'WAVE', 'TIDE', 'BEACH', 'SAND', 'ROCK', 'STONE', 'CLAY', 'MUD',
            'DUST', 'DIRT', 'EARTH', 'GROUND', 'SOIL', 'LAND', 'ISLAND', 'CONTINENT'
        ]
        return set(default_words)
    except Exception as e:
        print(f"Error loading dictionary: {e}")
        return set(COMMON_WORDS)

DICTIONARY = load_dictionary()

# ==================== AI KNOWLEDGE BASE ====================

def load_ai_knowledge_base():
    try:
        with open('ai_knowledge_base.json', 'r', encoding='utf-8') as f:
            return json.load(f)
    except FileNotFoundError:
        print("AI Knowledge Base not found. Using default knowledge.")
        return {
            "version": "1.0",
            "knowledge_domains": {
                "word_challenges": {
                    "name": "Word Challenges",
                    "emoji": "🔤",
                    "core_topics": [
                        "Scrabble strategy",
                        "Word formation",
                        "Vocabulary building",
                        "Letter values",
                        "Board positioning"
                    ],
                    "key_facts": {
                        "scrabble": [
                            "The highest scoring word possible is 'OXAZEPAM' worth 1,450 points!",
                            "There are 100 tiles in a standard Scrabble set",
                            "The blank tile can represent any letter",
                            "Bingo is when you use all 7 tiles in one play, earning a 50-point bonus"
                        ],
                        "strategy": [
                            "Save 'S' tiles for pluralizing words on bonus squares",
                            "Try to use high-value letters like Q, Z, J, X on double/triple letter scores",
                            "Block your opponent from accessing premium squares",
                            "Learn two-letter words for better tile placement"
                        ]
                    },
                    "common_questions": {
                        "what_is": {
                            "bingo": "A bingo is playing all 7 tiles at once for a 50-point bonus",
                            "rack": "Your rack is the set of tiles you currently hold",
                            "hook": "A hook is a letter added to the beginning or end of an existing word"
                        }
                    }
                }
            },
            "characters": {
                "GIGA": {
                    "catchphrases": [
                        "Words have power! Let's build some! 📚",
                        "Every word you learn is a new superpower! 💪",
                        "The right word at the right time changes everything! ✨",
                        "Your vocabulary is your greatest weapon! 🗡️"
                    ],
                    "affinity_messages": {
                        "low": [
                            "Keep playing! You'll discover amazing words! 🌱",
                            "Every challenge makes you stronger! 💫"
                        ],
                        "medium": [
                            "You're getting better at this! Your word choices are improving! 📈",
                            "I love watching you learn new words! 🎯"
                        ],
                        "high": [
                            "You're becoming a word wizard! 🧙",
                            "Your vocabulary is expanding beautifully! 🌟"
                        ],
                        "max": [
                            "You're a true wordsmith! The dictionary is your domain! 📖",
                            "Together we're building a world of knowledge through words! 🌍"
                        ]
                    }
                },
                "ACE": {
                    "catchphrases": [
                        "Word placement analysis: Optimal. 🎯",
                        "Letter value optimization calculated. 📊",
                        "Scrabble probability assessment complete. 🔢",
                        "Vocabulary efficiency: High. ✅"
                    ],
                    "affinity_messages": {
                        "low": [
                            "Word construction protocol engaged.",
                            "Letter arrangement efficiency: Acceptable."
                        ],
                        "medium": [
                            "Word formation patterns: Improving.",
                            "Strategic placement analysis: Above average."
                        ],
                        "high": [
                            "Lexical proficiency: Advanced.",
                            "Spatial word optimization: Excellent."
                        ],
                        "max": [
                            "Vocabulary mastery: Elite level detected.",
                            "Scrabble strategy algorithms: Peak performance."
                        ]
                    }
                }
            },
            "challenge_mechanics_knowledge": {
                "word_validation": "Words are checked against an official Scrabble dictionary",
                "scoring": "Points are calculated based on letter values and bonus squares",
                "tile_rack": "Players draw 7 tiles at the start of their turn",
                "passing": "Players may pass their turn if they cannot form a word"
            }
        }

AI_KNOWLEDGE = load_ai_knowledge_base()

def get_topic_icon_url(icon_value):
    """Resolve topic icon to an image URL.
    - If icon is an emoji, return Twemoji SVG URL.
    - If icon is a filename, serve from /static.
    - If icon is already a URL/path, return as-is.
    """
    if not icon_value:
        return url_for('static', filename='logo.png')

    value = str(icon_value).strip()
    if not value:
        return url_for('static', filename='logo.png')

    if value.startswith('http://') or value.startswith('https://') or value.startswith('/'):
        return value

    lower = value.lower()
    if lower.endswith(('.png', '.jpg', '.jpeg', '.webp', '.gif', '.svg', '.ico')):
        return url_for('static', filename=value)

    # Treat non-file values as emoji and map to Twemoji SVG
    codepoints = [f"{ord(ch):x}" for ch in value if ord(ch) != 0xfe0f]
    if codepoints:
        return f"https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/{'-'.join(codepoints)}.svg"

    return url_for('static', filename='logo.png')

# ==================== CHALLENGE STATE ENUMS ====================

class ChallengeStatus(Enum):
    WAITING = 'waiting'
    IN_PROGRESS = 'in_progress'
    COMPLETED = 'completed'
    ABANDONED = 'abandoned'

class ChallengeType(Enum):
    FRIEND = 'friend'
    RANDOM = 'random'
    PRACTICE = 'practice'
    TOURNAMENT = 'tournament'

# ==================== WORD CHALLENGE MODELS ====================

class WordChallenge(db.Model):
    """Word challenge session model"""
    id = db.Column(db.Integer, primary_key=True)
    challenge_type = db.Column(db.String(20), default='friend')
    status = db.Column(db.String(20), default='waiting')
    board_state = db.Column(db.Text, nullable=False, default='{}')
    tile_bag = db.Column(db.Text, nullable=False, default='[]')
    created_at = db.Column(db.DateTime, default=datetime.datetime.utcnow)
    started_at = db.Column(db.DateTime, nullable=True)
    completed_at = db.Column(db.DateTime, nullable=True)
    current_turn = db.Column(db.Integer, nullable=True)
    turn_expiry = db.Column(db.DateTime, nullable=True)
    winner_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=True)
    pass_count = db.Column(db.Integer, default=0)
    max_passes = db.Column(db.Integer, default=3)
    
    # Relationships
    players = db.relationship('WordChallengePlayer', backref='challenge', lazy=True)
    moves = db.relationship('WordChallengeMove', backref='challenge', lazy=True)
    chat_messages = db.relationship('WordChallengeChat', backref='challenge', lazy=True)
    winner = db.relationship('User', foreign_keys=[winner_id])
    
    def to_dict(self):
        return {
            'id': self.id,
            'challenge_type': self.challenge_type,
            'status': self.status,
            'board_state': json.loads(self.board_state),
            'tile_bag': json.loads(self.tile_bag),
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'started_at': self.started_at.isoformat() if self.started_at else None,
            'completed_at': self.completed_at.isoformat() if self.completed_at else None,
            'current_turn': self.current_turn,
            'turn_expiry': self.turn_expiry.isoformat() if self.turn_expiry else None,
            'winner_id': self.winner_id,
            'pass_count': self.pass_count,
            'max_passes': self.max_passes
        }
    
    def initialize_board(self):
        """Initialize a 15x15 empty board"""
        board = []
        for i in range(15):
            row = []
            for j in range(15):
                row.append({
                    'letter': None,
                    'player_id': None,
                    'move_id': None,
                    'bonus': BOARD_BONUSES.get((i, j), None)
                })
            board.append(row)
        self.board_state = json.dumps(board)
    
    def initialize_tile_bag(self):
        """Initialize tile bag with standard distribution"""
        tile_bag = []
        for letter, count in LETTER_DISTRIBUTION.items():
            for _ in range(count):
                tile_bag.append({
                    'letter': letter,
                    'value': LETTER_VALUES[letter]
                })
        random.shuffle(tile_bag)
        self.tile_bag = json.dumps(tile_bag)
    
    def draw_tiles(self, count=1):
        """Draw tiles from the bag"""
        tile_bag = json.loads(self.tile_bag)
        drawn_tiles = []
        for _ in range(count):
            if tile_bag:
                drawn_tiles.append(tile_bag.pop())
        self.tile_bag = json.dumps(tile_bag)
        return drawn_tiles
    
    def get_board(self):
        """Get board as 2D list"""
        return json.loads(self.board_state)
    
    def set_board(self, board):
        """Set board from 2D list"""
        self.board_state = json.dumps(board)
    
    def get_tile_bag_count(self):
        """Get number of tiles remaining in bag"""
        return len(json.loads(self.tile_bag))

class WordChallengePlayer(db.Model):
    """Player participation in word challenge"""
    id = db.Column(db.Integer, primary_key=True)
    challenge_id = db.Column(db.Integer, db.ForeignKey('word_challenge.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    player_number = db.Column(db.Integer, nullable=False)  # 1 or 2
    score = db.Column(db.Integer, default=0)
    rack = db.Column(db.Text, default='[]')  # JSON list of tiles
    is_ready = db.Column(db.Boolean, default=False)
    is_turn = db.Column(db.Boolean, default=False)
    turn_order = db.Column(db.Integer, default=0)
    joined_at = db.Column(db.DateTime, default=datetime.datetime.utcnow)
    
    user = db.relationship('User', foreign_keys=[user_id])
    
    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'username': self.user.username if self.user else 'Player',
            'player_number': self.player_number,
            'score': self.score,
            'rack': json.loads(self.rack),
            'is_ready': self.is_ready,
            'is_turn': self.is_turn
        }
    
    def get_rack(self):
        """Get rack as list of tiles"""
        return json.loads(self.rack)
    
    def set_rack(self, rack):
        """Set rack from list of tiles"""
        self.rack = json.dumps(rack)
    
    def remove_tiles(self, letters):
        """Remove specific tiles from rack"""
        rack = self.get_rack()
        remaining_rack = []
        letters_to_remove = list(letters)
        
        for tile in rack:
            if letters_to_remove and tile['letter'] in letters_to_remove:
                letters_to_remove.remove(tile['letter'])
            else:
                remaining_rack.append(tile)
        
        self.set_rack(remaining_rack)
        return len(letters_to_remove) == 0  # True if all letters were found

class WordChallengeMove(db.Model):
    """Word challenge move record"""
    id = db.Column(db.Integer, primary_key=True)
    challenge_id = db.Column(db.Integer, db.ForeignKey('word_challenge.id'), nullable=False)
    player_id = db.Column(db.Integer, db.ForeignKey('word_challenge_player.id'), nullable=False)
    word_played = db.Column(db.String(50), nullable=False)
    positions = db.Column(db.Text, nullable=False)  # JSON list of positions
    score = db.Column(db.Integer, nullable=False)
    tiles_used = db.Column(db.Integer, nullable=False)
    is_bingo = db.Column(db.Boolean, default=False)
    move_number = db.Column(db.Integer, nullable=False)
    timestamp = db.Column(db.DateTime, default=datetime.datetime.utcnow)
    
    player = db.relationship('WordChallengePlayer', foreign_keys=[player_id])
    
    def to_dict(self):
        return {
            'id': self.id,
            'word': self.word_played,
            'positions': json.loads(self.positions),
            'score': self.score,
            'tiles_used': self.tiles_used,
            'is_bingo': self.is_bingo,
            'move_number': self.move_number,
            'timestamp': self.timestamp.isoformat() if self.timestamp else None
        }

class WordChallengeChat(db.Model):
    """In-challenge chat messages"""
    id = db.Column(db.Integer, primary_key=True)
    challenge_id = db.Column(db.Integer, db.ForeignKey('word_challenge.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    message = db.Column(db.Text, nullable=False)
    timestamp = db.Column(db.DateTime, default=datetime.datetime.utcnow)
    
    user = db.relationship('User', foreign_keys=[user_id])
    
    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'username': self.user.username if self.user else 'Player',
            'message': self.message,
            'timestamp': self.timestamp.isoformat() if self.timestamp else None
        }

class WordChallengeInvite(db.Model):
    """Challenge invitations"""
    id = db.Column(db.Integer, primary_key=True)
    challenge_id = db.Column(db.Integer, db.ForeignKey('word_challenge.id'), nullable=False)
    inviter_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    invitee_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    status = db.Column(db.String(20), default='pending')  # pending, accepted, declined, expired
    created_at = db.Column(db.DateTime, default=datetime.datetime.utcnow)
    expires_at = db.Column(db.DateTime, nullable=False)
    
    challenge = db.relationship('WordChallenge', foreign_keys=[challenge_id])
    inviter = db.relationship('User', foreign_keys=[inviter_id])
    invitee = db.relationship('User', foreign_keys=[invitee_id])

class WordChallengeDailyChallenge(db.Model):
    """Daily word challenge challenges"""
    id = db.Column(db.Integer, primary_key=True)
    date = db.Column(db.Date, nullable=False, unique=True)
    target_score = db.Column(db.Integer, nullable=False)
    target_words = db.Column(db.Integer, nullable=False)
    bonus_geek = db.Column(db.Float, default=5.0)
    bonus_xp = db.Column(db.Integer, default=50)
    description = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.datetime.utcnow)

class WordChallengeUserProgress(db.Model):
    """User progress on daily challenges"""
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    challenge_id = db.Column(db.Integer, db.ForeignKey('word_challenge_daily_challenge.id'), nullable=False)
    challenges_played = db.Column(db.Integer, default=0)
    total_score = db.Column(db.Integer, default=0)
    total_words = db.Column(db.Integer, default=0)
    completed = db.Column(db.Boolean, default=False)
    reward_claimed = db.Column(db.Boolean, default=False)
    last_updated = db.Column(db.DateTime, default=datetime.datetime.utcnow)
    
    user = db.relationship('User', foreign_keys=[user_id])
    challenge = db.relationship('WordChallengeDailyChallenge', foreign_keys=[challenge_id])

# ==================== EXISTING MODELS (Keep all your original models) ====================

class User(UserMixin, db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(50), unique=True, nullable=False)
    email = db.Column(db.String(100), unique=True, nullable=False)
    password_hash = db.Column(db.String(200), nullable=False)
    wallet_address = db.Column(db.String(100))
    points = db.Column(db.Integer, default=0)
    geek_balance = db.Column(db.Float, default=0.0)
    xp = db.Column(db.Integer, default=0)
    level = db.Column(db.Integer, default=1)
    current_streak = db.Column(db.Integer, default=0)
    last_login_date = db.Column(db.Date)
    longest_streak = db.Column(db.Integer, default=0)
    streak_milestone_rewards = db.Column(db.String(500), default='[]')
    role = db.Column(db.String(20), default='player')
    is_admin = db.Column(db.Boolean, default=False)
    date_created = db.Column(db.DateTime, default=datetime.datetime.utcnow)
    reputation_score = db.Column(db.Float, default=100.0)
    total_earned_geek = db.Column(db.Float, default=0.0)
    questions_submitted = db.Column(db.Integer, default=0)
    questions_approved = db.Column(db.Integer, default=0)
    questions_rejected = db.Column(db.Integer, default=0)
    reviews_completed = db.Column(db.Integer, default=0)
    review_accuracy = db.Column(db.Float, default=0.0)
    streak_bonus_multiplier = db.Column(db.Float, default=1.0)
    favorite_character = db.Column(db.String(20), default='GIGA')
    character_interaction_history = db.Column(db.Text, default='[]')
    character_affinity_giga = db.Column(db.Float, default=50.0)
    character_affinity_ace = db.Column(db.Float, default=50.0)
    last_character_interaction = db.Column(db.DateTime, nullable=True)
    preferred_difficulty = db.Column(db.String(20), default='mixed')
    average_response_time = db.Column(db.Float, default=15.0)
    category_accuracies = db.Column(db.Text, default='{}')
    learning_style = db.Column(db.String(50), default='balanced')
    ai_interaction_count = db.Column(db.Integer, default=0)
    last_ai_recommendation = db.Column(db.Text, nullable=True)
    
    # Word challenge fields
    word_challenge_wins = db.Column(db.Integer, default=0)
    word_challenge_losses = db.Column(db.Integer, default=0)
    word_challenge_draws = db.Column(db.Integer, default=0)
    word_challenge_high_score = db.Column(db.Integer, default=0)
    word_challenge_total_score = db.Column(db.Integer, default=0)
    word_challenge_longest_word = db.Column(db.String(50), nullable=True)
    word_challenge_favorite_letter = db.Column(db.String(1), nullable=True)
    word_challenge_bingos = db.Column(db.Integer, default=0)
    
    def set_password(self, password):
        self.password_hash = generate_password_hash(password)
        
    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

    def get_display_name(self):
        """Return username for display purposes"""
        return self.username
        
    def update_level(self):
        old_level = self.level
        new_level = 1
        while new_level < 100:
            xp_required = self.calculate_xp_required(new_level + 1)
            if self.xp >= xp_required:
                new_level += 1
            else:
                break
        if new_level != self.level:
            self.level = new_level
            return True
        return False
        
    def calculate_xp_required(self, level):
        """Calculate XP required to reach a given level with proper scaling to 100"""
        if level <= 1:
            return 0
        base_xp = 1000
        return int(base_xp * (level ** 1.5))

    def get_next_milestone(self):
        """Get the next 10-level milestone"""
        current_stage = (self.level // 10) * 10
        next_stage = current_stage + 10
        if next_stage > 100:
            next_stage = 100
        return next_stage

    def get_milestone_reward(self, milestone_level):
        """Get rewards for reaching milestone levels"""
        rewards = {
            10: {"geek": 50, "xp": 500, "title": "Apprentice", "sticker_pack": 3},
            20: {"geek": 100, "xp": 1000, "title": "Journeyman", "sticker_pack": 5},
            30: {"geek": 200, "xp": 2000, "title": "Adept", "sticker_pack": 7},
            40: {"geek": 300, "xp": 3000, "title": "Expert", "sticker_pack": 10},
            50: {"geek": 500, "xp": 5000, "title": "Master", "sticker_pack": 15},
            60: {"geek": 750, "xp": 7500, "title": "Grandmaster", "sticker_pack": 20},
            70: {"geek": 1000, "xp": 10000, "title": "Legend", "sticker_pack": 25},
            80: {"geek": 1500, "xp": 15000, "title": "Champion", "sticker_pack": 30},
            90: {"geek": 2000, "xp": 20000, "title": "Elite", "sticker_pack": 35},
            100: {"geek": 5000, "xp": 50000, "title": "ULTIMATE GEEK", "sticker_pack": 50, "badge": True}
        }
        return rewards.get(milestone_level, {"geek": 0, "xp": 0})

    def get_level_title(self):
        """Get formatted level title with stage"""
        stage = get_level_stage(self.level)
        return f"Level {self.level} {stage['tag']}"

    def get_level_color(self):
        """Get color class for level badge"""
        stage = get_level_stage(self.level)
        return stage['color']

    def get_level_icon(self):
        """Get icon for level"""
        stage = get_level_stage(self.level)
        return stage['icon']

    def get_xp_for_next_milestone(self):
        """Get XP needed for next 10-level milestone"""
        next_milestone = self.get_next_milestone()
        xp_required = self.calculate_xp_required(next_milestone)
        return max(0, xp_required - self.xp)

    def get_milestone_progress(self):
        """Get progress percentage to next milestone"""
        next_milestone = self.get_next_milestone()
        current_milestone = ((self.level - 1) // 10) * 10
        if current_milestone < 1:
            current_milestone = 1
        
        current_xp = self.calculate_xp_required(current_milestone)
        next_xp = self.calculate_xp_required(next_milestone)
        
        if next_xp > current_xp:
            progress = ((self.xp - current_xp) / (next_xp - current_xp)) * 100
            return min(100, max(0, progress))
        return 100
        
    def get_xp_progress(self):
        current_level_xp = self.calculate_xp_required(self.level)
        next_level_xp = self.calculate_xp_required(self.level + 1)
        xp_needed = next_level_xp - current_level_xp
        current_xp_in_level = self.xp - current_level_xp
        if xp_needed > 0:
            progress_percentage = (current_xp_in_level / xp_needed) * 100
        else:
            progress_percentage = 100
        return {
            'current_xp': self.xp,
            'current_level_xp': current_level_xp,
            'next_level_xp': next_level_xp,
            'xp_needed': xp_needed,
            'current_xp_in_level': current_xp_in_level,
            'progress_percentage': progress_percentage
        }
        
    def update_streak_milestones(self):
        try:
            milestones_claimed = json.loads(self.streak_milestone_rewards)
        except:
            milestones_claimed = []
        streak = self.current_streak
        rewards = []
        if streak >= 7 and 7 not in milestones_claimed:
            rewards.append({'days': 7, 'xp': 100, 'geek': 10})
        if streak >= 30 and 30 not in milestones_claimed:
            rewards.append({'days': 30, 'xp': 500, 'geek': 50})
        if streak >= 90 and 90 not in milestones_claimed:
            rewards.append({'days': 90, 'xp': 1500, 'geek': 150})
        if streak >= 365 and 365 not in milestones_claimed:
            rewards.append({'days': 365, 'xp': 10000, 'geek': 1000})
        return rewards
        
    def get_character_interactions(self):
        try:
            return json.loads(self.character_interaction_history)
        except:
            return []
            
    def add_character_interaction(self, character, interaction_type, details=None):
        interactions = self.get_character_interactions()
        interaction = {
            'character': character,
            'type': interaction_type,
            'timestamp': datetime.datetime.utcnow().isoformat(),
            'details': details
        }
        interactions.append(interaction)
        if len(interactions) > 100:
            interactions = interactions[-100:]
        self.character_interaction_history = json.dumps(interactions)
        self.last_character_interaction = datetime.datetime.utcnow()
        
        if character == 'GIGA':
            if interaction_type in ['welcome', 'encouragement', 'celebration']:
                self.character_affinity_giga = min(100.0, self.character_affinity_giga + 0.5)
            elif interaction_type in ['streak_login', 'level_up', 'achievement_unlocked', 'word_challenge_win']:
                self.character_affinity_giga = min(100.0, self.character_affinity_giga + 1.0)
            elif interaction_type in ['bingo_scored', 'high_score_achieved']:
                self.character_affinity_giga = min(100.0, self.character_affinity_giga + 1.5)
        elif character == 'ACE':
            if interaction_type in ['challenge', 'correction', 'mastery']:
                self.character_affinity_ace = min(100.0, self.character_affinity_ace + 0.5)
            elif interaction_type in ['fast_correct_answer', 'perfect_round', 'word_placed', 'review_submitted']:
                self.character_affinity_ace = min(100.0, self.character_affinity_ace + 1.0)
            elif interaction_type in ['optimal_placement', 'high_value_word']:
                self.character_affinity_ace = min(100.0, self.character_affinity_ace + 1.5)
                
    def get_character_message(self, character, context=None):
        """Enhanced character message with AI knowledge base integration"""
        if character == 'GIGA':
            return get_giga_message(self, context)
        elif character == 'ACE':
            return get_ace_message(self, context)
        return None
    
    def update_topic_accuracy(self, topic_id, is_correct):
        try:
            accuracies = json.loads(self.category_accuracies)
        except:
            accuracies = {}
        
        cat_key = str(topic_id)
        if cat_key not in accuracies:
            accuracies[cat_key] = {'total': 0, 'correct': 0}
        
        accuracies[cat_key]['total'] += 1
        if is_correct:
            accuracies[cat_key]['correct'] += 1
        
        self.category_accuracies = json.dumps(accuracies)
    
    def get_weak_topics(self, threshold=60):
        try:
            accuracies = json.loads(self.category_accuracies)
        except:
            return []
        
        weak_topics = []
        for cat_id, stats in accuracies.items():
            if stats['total'] >= 5:
                accuracy = (stats['correct'] / stats['total']) * 100
                if accuracy < threshold:
                    weak_topics.append({
                        'topic_id': int(cat_id),
                        'accuracy': round(accuracy, 1),
                        'attempts': stats['total']
                    })
        
        return sorted(weak_topics, key=lambda x: x['accuracy'])
    
    def get_strong_topics(self, threshold=80):
        try:
            accuracies = json.loads(self.category_accuracies)
        except:
            return []
        
        strong_topics = []
        for cat_id, stats in accuracies.items():
            if stats['total'] >= 5:
                accuracy = (stats['correct'] / stats['total']) * 100
                if accuracy > threshold:
                    strong_topics.append({
                        'topic_id': int(cat_id),
                        'accuracy': round(accuracy, 1),
                        'attempts': stats['total']
                    })
        
        return sorted(strong_topics, key=lambda x: x['accuracy'], reverse=True)
    
    def update_word_challenge_stats(self, score, is_win=False, is_loss=False, is_draw=False, 
                              word_played=None, is_bingo=False):
        """Update word challenge statistics"""
        self.word_challenge_total_score += score
        
        if score > self.word_challenge_high_score:
            self.word_challenge_high_score = score
        
        if is_win:
            self.word_challenge_wins += 1
        if is_loss:
            self.word_challenge_losses += 1
        if is_draw:
            self.word_challenge_draws += 1
        
        if word_played:
            if not self.word_challenge_longest_word or len(word_played) > len(self.word_challenge_longest_word):
                self.word_challenge_longest_word = word_played
        
        if is_bingo:
            self.word_challenge_bingos += 1
        
        # Calculate favorite letter based on usage (simplified)
        # In production, track letter usage in a separate table
        
        # Award XP for word challenge achievements
        if is_win:
            self.xp += 50
        if is_bingo:
            self.xp += 25
        if score > 100:
            self.xp += 20
        
        self.update_level()

# Keep all your existing models (Topic, Achievement, UserAchievement, StickerSeries, 
# Sticker, UserSticker, Question, QuestionValidation, Attempt, CreatorEarning, Reward,
# GauntletClaim, GauntletRun, ReviewQueue, CharacterInteraction, AIRecommendation, 
# AIMessageHistory) exactly as they were in your original code

# ==================== EXISTING MODELS (Placeholders - Add all your original models here) ====================

class Topic(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False, unique=True)
    description = db.Column(db.Text)
    icon = db.Column(db.String(100))
    is_active = db.Column(db.Boolean, default=True)
    date_created = db.Column(db.DateTime, default=datetime.datetime.utcnow)

class Achievement(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text, nullable=False)
    icon = db.Column(db.String(100), nullable=False)
    criteria_type = db.Column(db.String(50), nullable=False)
    criteria_value = db.Column(db.Integer, nullable=False)
    nft_token_id = db.Column(db.String(100), nullable=True)
    badge_rarity = db.Column(db.String(20), default='common')
    badge_frame = db.Column(db.String(20), default='bronze')
    badge_xp_bonus = db.Column(db.Integer, default=5)
    badge_token_reward = db.Column(db.Float, default=0.0)
    tier = db.Column(db.String(20), default='bronze')
    tier_order = db.Column(db.Integer, default=1)
    track_name = db.Column(db.String(100), nullable=True)
    is_hidden = db.Column(db.String(5), default='false')
    is_secret = db.Column(db.Boolean, default=False)
    prerequisite_achievement_id = db.Column(db.Integer, db.ForeignKey('achievement.id'), nullable=True)
    unlock_animation = db.Column(db.String(50), default='standard')
    geek_reward = db.Column(db.Float, default=0.0)
    xp_reward = db.Column(db.Integer, default=0)
    sticker_pack_reward = db.Column(db.Integer, default=0)

class UserAchievement(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'))
    achievement_id = db.Column(db.Integer, db.ForeignKey('achievement.id'))
    date_unlocked = db.Column(db.DateTime, default=datetime.datetime.utcnow)
    tier_reached = db.Column(db.String(20), default='bronze')
    was_hidden = db.Column(db.Boolean, default=False)
    notification_shown = db.Column(db.Boolean, default=False)
    achievement = db.relationship('Achievement', backref='user_achievements')

class StickerSeries(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)
    total_stickers = db.Column(db.Integer, nullable=False)
    is_active = db.Column(db.Boolean, default=True)

class Sticker(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    series_id = db.Column(db.Integer, db.ForeignKey('sticker_series.id'))
    name = db.Column(db.String(100), nullable=False)
    image = db.Column(db.String(100), nullable=False)
    rarity = db.Column(db.String(20), default='common')
    number = db.Column(db.Integer, nullable=False)
    series = db.relationship('StickerSeries', backref='stickers')

class UserSticker(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'))
    sticker_id = db.Column(db.Integer, db.ForeignKey('sticker.id'))
    is_duplicate = db.Column(db.Boolean, default=False)
    date_acquired = db.Column(db.DateTime, default=datetime.datetime.utcnow)
    sticker = db.relationship('Sticker', backref='user_stickers')

class StickerPack(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    pack_type = db.Column(db.String(50), default='standard')
    series_id = db.Column(db.Integer, db.ForeignKey('sticker_series.id'), nullable=True)
    stickers_per_pack = db.Column(db.Integer, default=5)
    guaranteed_rarity = db.Column(db.String(20), nullable=True)
    source = db.Column(db.String(100), nullable=True)
    source_detail = db.Column(db.String(200), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.datetime.utcnow)
    opened_at = db.Column(db.DateTime, nullable=True)
    is_opened = db.Column(db.Boolean, default=False)

    user = db.relationship('User', foreign_keys=[user_id])
    series = db.relationship('StickerSeries', foreign_keys=[series_id])

class GeekDust(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    amount = db.Column(db.Integer, default=0)
    total_earned = db.Column(db.Integer, default=0)
    total_spent = db.Column(db.Integer, default=0)
    updated_at = db.Column(db.DateTime, default=datetime.datetime.utcnow)

    user = db.relationship('User', foreign_keys=[user_id])

    @classmethod
    def get_or_create(cls, user_id, commit=True):
        dust = cls.query.filter_by(user_id=user_id).first()
        if not dust:
            dust = cls(user_id=user_id, amount=0)
            db.session.add(dust)
            if commit:
                db.session.commit()
            else:
                db.session.flush()
        return dust

class CraftingRecipe(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    rarity = db.Column(db.String(20), unique=True, nullable=False)
    dust_cost = db.Column(db.Integer, nullable=False)

class DustTransaction(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    amount = db.Column(db.Integer, nullable=False)
    reason = db.Column(db.String(200), nullable=False)
    sticker_id = db.Column(db.Integer, db.ForeignKey('sticker.id'), nullable=True)
    timestamp = db.Column(db.DateTime, default=datetime.datetime.utcnow)

class SeriesCompletion(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    series_id = db.Column(db.Integer, db.ForeignKey('sticker_series.id'), nullable=False)
    date_completed = db.Column(db.DateTime, default=datetime.datetime.utcnow)

class Question(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    question = db.Column(db.Text, nullable=False)
    option1 = db.Column(db.String(200), nullable=False)
    option2 = db.Column(db.String(200), nullable=False)
    option3 = db.Column(db.String(200), nullable=False)
    option4 = db.Column(db.String(200), nullable=False)
    correct_option = db.Column(db.Integer, nullable=False)
    difficulty = db.Column(db.String(20), default='easy')
    topic_id = db.Column(db.Integer, db.ForeignKey('topic.id'), nullable=False)
    created_by = db.Column(db.Integer, db.ForeignKey('user.id'))
    status = db.Column(db.String(20), default='pending')
    approved_by = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=True)
    validated_by = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=True)
    date_created = db.Column(db.DateTime, default=datetime.datetime.utcnow)
    source_link = db.Column(db.String(500), nullable=True)
    approvals_count = db.Column(db.Integer, default=0)
    rejections_count = db.Column(db.Integer, default=0)
    total_reviews = db.Column(db.Integer, default=0)
    date_approved = db.Column(db.DateTime, nullable=True)
    date_first_served = db.Column(db.DateTime, nullable=True)
    date_last_served = db.Column(db.DateTime, nullable=True)
    total_serves = db.Column(db.Integer, default=0)
    total_earned = db.Column(db.Float, default=0.0)
    average_time_to_answer = db.Column(db.Float, default=0.0)
    skip_rate = db.Column(db.Float, default=0.0)
    player_rating = db.Column(db.Float, default=0.0)
    ai_difficulty_score = db.Column(db.Float, default=0.0)
    topic_tags = db.Column(db.String(500), default='[]')
    subtopic = db.Column(db.String(100), nullable=True)
    year_released = db.Column(db.Integer, nullable=True)
    fun_fact = db.Column(db.Text, nullable=True)
    topic = db.relationship('Topic', backref='questions')
    creator = db.relationship('User', foreign_keys=[created_by], backref='created_questions')
    approver = db.relationship('User', foreign_keys=[approved_by])
    validator = db.relationship('User', foreign_keys=[validated_by])

class QuestionValidation(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    question_id = db.Column(db.Integer, db.ForeignKey('question.id'))
    validator_id = db.Column(db.Integer, db.ForeignKey('user.id'))
    action = db.Column(db.String(20), nullable=False)
    points_awarded = db.Column(db.Integer, default=0)
    geek_awarded = db.Column(db.Float, default=0.1)
    timestamp = db.Column(db.DateTime, default=datetime.datetime.utcnow)
    review_time = db.Column(db.Float, default=0.0)
    detailed_feedback = db.Column(db.Text, nullable=True)
    question = db.relationship('Question', backref='validations')
    validator = db.relationship('User', backref='validations')

class Attempt(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'))
    question_id = db.Column(db.Integer, db.ForeignKey('question.id'))
    selected_option = db.Column(db.Integer, nullable=False)
    is_correct = db.Column(db.Boolean, nullable=False)
    time_taken = db.Column(db.Float, default=15.0)
    session_id = db.Column(db.String(100), nullable=True)
    date_attempted = db.Column(db.DateTime, default=datetime.datetime.utcnow)
    was_skipped = db.Column(db.Boolean, default=False)
    question_rating = db.Column(db.Integer, nullable=True)
    streak_bonus_applied = db.Column(db.Float, default=1.0)
    character_present = db.Column(db.String(20), nullable=True)
    character_message_shown = db.Column(db.String(500), nullable=True)
    confidence_level = db.Column(db.Integer, nullable=True)
    device_type = db.Column(db.String(20), nullable=True)
    hour_of_day = db.Column(db.Integer, nullable=True)
    day_of_week = db.Column(db.Integer, nullable=True)
    question = db.relationship('Question')

class CreatorEarning(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    creator_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    question_id = db.Column(db.Integer, db.ForeignKey('question.id'), nullable=False)
    amount = db.Column(db.Float, default=0.0)
    timestamp = db.Column(db.DateTime, default=datetime.datetime.utcnow)
    session_id = db.Column(db.String(100), nullable=True)
    player_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=True)
    creator = db.relationship('User', foreign_keys=[creator_id], backref='creator_earnings')
    question = db.relationship('Question', backref='creator_earnings')
    player = db.relationship('User', foreign_keys=[player_id])

class Reward(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'))
    points_spent = db.Column(db.Integer, nullable=False)
    token_rewarded = db.Column(db.Float, nullable=False)
    timestamp = db.Column(db.DateTime, default=datetime.datetime.utcnow)

class EconomyConfig(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    points_per_geek = db.Column(db.Integer, nullable=False, default=DEFAULT_POINTS_PER_GEEK)
    minimum_points = db.Column(db.Integer, nullable=False, default=DEFAULT_MIN_CONVERSION_POINTS)
    exchange_listing_expiry_hours = db.Column(db.Integer, nullable=False, default=DEFAULT_EXCHANGE_EXPIRY_HOURS)
    updated_at = db.Column(db.DateTime, default=datetime.datetime.utcnow)

class PointsConversionTransaction(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    points_spent = db.Column(db.Integer, nullable=False)
    geek_received = db.Column(db.Float, nullable=False)
    rate_points_per_geek = db.Column(db.Integer, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.datetime.utcnow)

class StickerPurchaseTransaction(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    buyer_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    sticker_id = db.Column(db.Integer, db.ForeignKey('sticker.id'), nullable=False)
    price_geek = db.Column(db.Float, nullable=False)
    was_duplicate = db.Column(db.Boolean, default=False)
    dust_awarded = db.Column(db.Integer, default=0)
    source = db.Column(db.String(32), default='direct_shop')
    created_at = db.Column(db.DateTime, default=datetime.datetime.utcnow)

class ExchangeListing(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    seller_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    seller_user_sticker_id = db.Column(db.Integer, db.ForeignKey('user_sticker.id'), nullable=False)
    sticker_id = db.Column(db.Integer, db.ForeignKey('sticker.id'), nullable=False)
    ask_price_geek = db.Column(db.Float, nullable=True)
    requested_sticker_ids_json = db.Column(db.Text, nullable=True)
    status = db.Column(db.String(20), default='active')  # active, completed, cancelled, expired
    created_at = db.Column(db.DateTime, default=datetime.datetime.utcnow)
    expires_at = db.Column(db.DateTime, nullable=False)
    completed_at = db.Column(db.DateTime, nullable=True)
    cancelled_at = db.Column(db.DateTime, nullable=True)
    completed_by_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=True)

class ExchangeOffer(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    listing_id = db.Column(db.Integer, db.ForeignKey('exchange_listing.id'), nullable=False)
    offerer_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    offered_user_sticker_ids_json = db.Column(db.Text, nullable=False)
    note = db.Column(db.String(300), nullable=True)
    status = db.Column(db.String(20), default='pending')  # pending, accepted, declined, cancelled
    created_at = db.Column(db.DateTime, default=datetime.datetime.utcnow)
    responded_at = db.Column(db.DateTime, nullable=True)

class ExchangeTransaction(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    listing_id = db.Column(db.Integer, db.ForeignKey('exchange_listing.id'), nullable=False)
    seller_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    buyer_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    tx_type = db.Column(db.String(20), nullable=False)  # sale, trade
    geek_amount = db.Column(db.Float, nullable=False, default=0.0)
    seller_sticker_id = db.Column(db.Integer, db.ForeignKey('sticker.id'), nullable=False)
    buyer_sticker_ids_json = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.datetime.utcnow)

class UserNotification(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    title = db.Column(db.String(120), nullable=False)
    message = db.Column(db.String(500), nullable=False)
    category = db.Column(db.String(30), default='exchange')
    is_read = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.datetime.utcnow)

class GauntletClaim(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    run_id = db.Column(db.Integer, db.ForeignKey('gauntlet_run.id'), nullable=False)
    amount = db.Column(db.Float, nullable=False)
    status = db.Column(db.String(20), default='claimed')
    timestamp = db.Column(db.DateTime, default=datetime.datetime.utcnow)

class GauntletRun(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'))
    highest_round = db.Column(db.Integer, default=0)
    total_correct = db.Column(db.Integer, default=0)
    total_questions = db.Column(db.Integer, default=0)
    total_geek_earned = db.Column(db.Float, default=0.0)
    total_xp_earned = db.Column(db.Integer, default=0)
    selected_topics = db.Column(db.Text, nullable=True)
    completed = db.Column(db.Boolean, default=False)
    active_round = db.Column(db.Integer, nullable=True)
    active_state = db.Column(db.Text, nullable=True)
    active_state_updated_at = db.Column(db.DateTime, nullable=True)
    date_started = db.Column(db.DateTime, default=datetime.datetime.utcnow)
    date_completed = db.Column(db.DateTime, nullable=True)

class ReviewQueue(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    question_id = db.Column(db.Integer, db.ForeignKey('question.id'))
    date_added = db.Column(db.DateTime, default=datetime.datetime.utcnow)
    priority = db.Column(db.Integer, default=0)
    last_shown = db.Column(db.DateTime, nullable=True)
    question = db.relationship('Question', backref='review_queue_entries')

class CharacterInteraction(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'))
    character = db.Column(db.String(20), nullable=False)
    interaction_type = db.Column(db.String(50), nullable=False)
    message = db.Column(db.Text, nullable=False)
    context = db.Column(db.String(100), nullable=True)
    timestamp = db.Column(db.DateTime, default=datetime.datetime.utcnow)
    user = db.relationship('User', backref='character_interactions')

class AIRecommendation(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'))
    recommendation_type = db.Column(db.String(50), nullable=False)
    content = db.Column(db.Text, nullable=False)
    context = db.Column(db.String(100), nullable=True)
    timestamp = db.Column(db.DateTime, default=datetime.datetime.utcnow)
    was_acted_upon = db.Column(db.Boolean, default=False)
    user = db.relationship('User', backref='ai_recommendations')

class AIMessageHistory(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'))
    character = db.Column(db.String(20), nullable=False)
    message = db.Column(db.Text, nullable=False)
    context = db.Column(db.String(100), nullable=True)
    user_sentiment = db.Column(db.String(20), nullable=True)
    timestamp = db.Column(db.DateTime, default=datetime.datetime.utcnow)
    user = db.relationship('User', backref='ai_message_history')

class KaspaPayment(db.Model):
    """Kaspa payment transaction model — real testnet-10 integration"""
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    # transaction_id: the real on-chain Kaspa tx ID (unique prevents double-crediting)
    # Initially set to a PENDING- placeholder; real txid set by user via /kaspa/submit_txid
    transaction_id = db.Column(db.String(200), unique=True, nullable=False)
    kaspa_amount = db.Column(db.Float, nullable=False)
    geek_amount = db.Column(db.Float, nullable=False)
    rate = db.Column(db.Float, nullable=False)
    status = db.Column(db.String(20), default='pending')  # pending, confirmed, expired
    wallet_address = db.Column(db.String(200), nullable=False)
    confirmations = db.Column(db.Integer, default=0)
    created_at = db.Column(db.DateTime, default=datetime.datetime.utcnow)
    confirmed_at = db.Column(db.DateTime, nullable=True)
    # New fields for real testnet integration:
    payment_reference = db.Column(db.String(64), unique=True, nullable=True)  # human-readable ref shown to user
    expires_at = db.Column(db.DateTime, nullable=True)                        # when the payment request expires
    sompi_amount = db.Column(db.BigInteger, nullable=True)                    # exact amount in sompi (1 KAS = 1e8 sompi)

    user = db.relationship('User', foreign_keys=[user_id])

    def to_dict(self):
        return {
            'id': self.id,
            'transaction_id': self.transaction_id,
            'payment_reference': self.payment_reference,
            'kaspa_amount': self.kaspa_amount,
            'geek_amount': self.geek_amount,
            'status': self.status,
            'confirmations': self.confirmations,
            'expires_at': self.expires_at.isoformat() if self.expires_at else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }

class KaspaPrice(db.Model):
    """Track Kaspa price for exchange rate"""
    id = db.Column(db.Integer, primary_key=True)
    usd_price = db.Column(db.Float, default=0.04)
    geek_per_kas = db.Column(db.Float, default=25)
    updated_at = db.Column(db.DateTime, default=datetime.datetime.utcnow)

    @classmethod
    def get_rate(cls):
        """Get current exchange rate"""
        rate = cls.query.order_by(cls.updated_at.desc()).first()
        if not rate:
            rate = cls(usd_price=0.04, geek_per_kas=25)
            db.session.add(rate)
            db.session.commit()
        return rate.geek_per_kas

# ==================== LOGIN MANAGER ====================

@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))

# ==================== EXISTING CONSTANTS (Keep all your original constants) ====================

CCE_REVIEW_REWARD_GEEK = 0.1
CCE_CREATOR_REWARD_PER_SERVE = 0.5
CCE_MAX_EARNINGS_PER_QUESTION = 1000.0
CCE_APPROVALS_NEEDED = 5
CCE_REVIEW_XP_REWARD = 1
CCE_MIN_LEVEL_FOR_CREATION = 10
CCE_MIN_LEVEL_FOR_REVIEW = 10

GAUNTLET_ROUNDS = [
    {"round": 1, "entry_fee": 0, "reward_per_correct": 10, "total_reward": 100, "difficulty": "easy", "questions": 10, "break_even": 0},
    {"round": 2, "entry_fee": 40, "reward_per_correct": 20, "total_reward": 200, "difficulty": "easy-medium", "questions": 10, "break_even": 2},
    {"round": 3, "entry_fee": 100, "reward_per_correct": 40, "total_reward": 400, "difficulty": "medium", "questions": 10, "break_even": 3},
    {"round": 4, "entry_fee": 200, "reward_per_correct": 75, "total_reward": 750, "difficulty": "medium-hard", "questions": 10, "break_even": 3},
    {"round": 5, "entry_fee": 400, "reward_per_correct": 125, "total_reward": 1250, "difficulty": "hard", "questions": 10, "break_even": 4},
    {"round": 6, "entry_fee": 750, "reward_per_correct": 200, "total_reward": 2000, "difficulty": "hard", "questions": 10, "break_even": 4},
    {"round": 7, "entry_fee": 1250, "reward_per_correct": 350, "total_reward": 3500, "difficulty": "very-hard", "questions": 10, "break_even": 4},
    {"round": 8, "entry_fee": 2000, "reward_per_correct": 500, "total_reward": 5000, "difficulty": "very-hard", "questions": 10, "break_even": 5},
    {"round": 9, "entry_fee": 3500, "reward_per_correct": 750, "total_reward": 7500, "difficulty": "expert", "questions": 10, "break_even": 5},
    {"round": 10, "entry_fee": 6000, "reward_per_correct": 1000, "total_reward": 10000, "difficulty": "expert", "questions": 10, "break_even": 7}
]

def get_round_total_reward(round_info):
    total_reward = round_info.get('total_reward')
    if total_reward is None:
        total_reward = round_info.get('reward_per_correct', 0) * round_info.get('questions', 0)
    return total_reward

def get_round_reward_per_question(round_info):
    total_reward = get_round_total_reward(round_info)
    questions = round_info.get('questions', 0) or 0
    if questions <= 0:
        return 0
    return total_reward / questions

def get_question_base_reward(round_info):
    """Calculate the base reward per question (round total divided equally)."""
    return get_round_reward_per_question(round_info)

# ==================== UPDATED LEVEL SYSTEM WITH STAGE TAGS ====================

LEVEL_STAGES = [
    {"range": (1, 9), "tag": "🌱 Novice", "color": "gray", "icon": "🌱"},
    {"range": (10, 19), "tag": "🔰 Apprentice", "color": "green", "icon": "🔰"},
    {"range": (20, 29), "tag": "⚙️ Journeyman", "color": "blue", "icon": "⚙️"},
    {"range": (30, 39), "tag": "🛡️ Adept", "color": "teal", "icon": "🛡️"},
    {"range": (40, 49), "tag": "⚔️ Expert", "color": "purple", "icon": "⚔️"},
    {"range": (50, 59), "tag": "🌟 Master", "color": "orange", "icon": "🌟"},
    {"range": (60, 69), "tag": "💫 Grandmaster", "color": "pink", "icon": "💫"},
    {"range": (70, 79), "tag": "🔥 Legend", "color": "red", "icon": "🔥"},
    {"range": (80, 89), "tag": "👑 Champion", "color": "yellow", "icon": "👑"},
    {"range": (90, 99), "tag": "⚡ Elite", "color": "cyan", "icon": "⚡"},
    {"range": (100, 100), "tag": "🏆 ULTIMATE GEEK", "color": "rainbow", "icon": "🏆✨"}
]

def get_level_stage(level):
    """Get the stage tag for a given level"""
    for stage in LEVEL_STAGES:
        if stage["range"][0] <= level <= stage["range"][1]:
            return stage
    return {"tag": "🌱 Novice", "color": "gray", "icon": "🌱"}

ACHIEVEMENTS = [
    {"name": "First Steps", "description": "Complete your first quiz", "icon": "first_steps.png", "criteria_type": "questions", "criteria_value": 1, "badge_rarity": "common", "badge_frame": "bronze", "badge_xp_bonus": 5, "badge_token_reward": 0.0},
    {"name": "Quiz Novice", "description": "Answer 10 questions correctly", "icon": "quiz_novice.png", "criteria_type": "correct_answers", "criteria_value": 10, "badge_rarity": "common", "badge_frame": "bronze", "badge_xp_bonus": 5, "badge_token_reward": 0.0},
    {"name": "Quiz Master", "description": "Answer 100 questions correctly", "icon": "quiz_master.png", "criteria_type": "correct_answers", "criteria_value": 100, "badge_rarity": "uncommon", "badge_frame": "silver", "badge_xp_bonus": 15, "badge_token_reward": 10.0},
    {"name": "Quiz Grandmaster", "description": "Answer 1000 questions correctly", "icon": "quiz_grandmaster.png", "criteria_type": "correct_answers", "criteria_value": 1000, "badge_rarity": "rare", "badge_frame": "gold", "badge_xp_bonus": 30, "badge_token_reward": 50.0},
    {"name": "Gauntlet Initiate", "description": "Complete Round 1 of the Geek Gauntlet", "icon": "gauntlet_initiate.png", "criteria_type": "gauntlet_round", "criteria_value": 1, "badge_rarity": "common", "badge_frame": "bronze", "badge_xp_bonus": 5, "badge_token_reward": 0.0},
    {"name": "Gauntlet Champion", "description": "Complete Round 5 of the Geek Gauntlet", "icon": "gauntlet_champion.png", "criteria_type": "gauntlet_round", "criteria_value": 5, "badge_rarity": "uncommon", "badge_frame": "silver", "badge_xp_bonus": 20, "badge_token_reward": 25.0},
    {"name": "Gauntlet Legend", "description": "Complete Round 10 of the Geek Gauntlet", "icon": "gauntlet_legend.png", "criteria_type": "gauntlet_round", "criteria_value": 10, "badge_rarity": "epic", "badge_frame": "platinum", "badge_xp_bonus": 75, "badge_token_reward": 100.0},
    {"name": "Daily Learner", "description": "Maintain a 7-day login streak", "icon": "daily_learner.png", "criteria_type": "streak", "criteria_value": 7, "badge_rarity": "common", "badge_frame": "bronze", "badge_xp_bonus": 5, "badge_token_reward": 0.0},
    {"name": "Dedicated Scholar", "description": "Maintain a 30-day login streak", "icon": "dedicated_scholar.png", "criteria_type": "streak", "criteria_value": 30, "badge_rarity": "uncommon", "badge_frame": "silver", "badge_xp_bonus": 20, "badge_token_reward": 25.0},
    {"name": "Streak Master", "description": "Maintain a 100-day login streak", "icon": "streak_master.png", "criteria_type": "streak", "criteria_value": 100, "badge_rarity": "rare", "badge_frame": "gold", "badge_xp_bonus": 50, "badge_token_reward": 100.0},
    {"name": "Rising Star", "description": "Reach Level 5", "icon": "rising_star.png", "criteria_type": "level", "criteria_value": 5, "badge_rarity": "common", "badge_frame": "bronze", "badge_xp_bonus": 5, "badge_token_reward": 0.0},
    {"name": "Geek Elite", "description": "Reach Level 10", "icon": "geek_elite.png", "criteria_type": "level", "criteria_value": 10, "badge_rarity": "common", "badge_frame": "bronze", "badge_xp_bonus": 10, "badge_token_reward": 5.0},
    {"name": "Seasoned Veteran", "description": "Reach Level 25", "icon": "seasoned_veteran.png", "criteria_type": "level", "criteria_value": 25, "badge_rarity": "uncommon", "badge_frame": "silver", "badge_xp_bonus": 25, "badge_token_reward": 25.0},
    {"name": "Master Geek", "description": "Reach Level 50", "icon": "master_geek.png", "criteria_type": "level", "criteria_value": 50, "badge_rarity": "rare", "badge_frame": "gold", "badge_xp_bonus": 50, "badge_token_reward": 50.0},
    {"name": "Legendary Scholar", "description": "Reach Level 75", "icon": "legendary_scholar.png", "criteria_type": "level", "criteria_value": 75, "badge_rarity": "epic", "badge_frame": "platinum", "badge_xp_bonus": 75, "badge_token_reward": 100.0},
    {"name": "Ultimate Geek", "description": "Reach Level 100", "icon": "ultimate_geek.png", "criteria_type": "level", "criteria_value": 100, "badge_rarity": "legendary", "badge_frame": "diamond", "badge_xp_bonus": 150, "badge_token_reward": 200.0},
    {"name": "Question Creator", "description": "Submit your first question", "icon": "question_creator.png", "criteria_type": "questions_submitted", "criteria_value": 1, "badge_rarity": "common", "badge_frame": "bronze", "badge_xp_bonus": 5, "badge_token_reward": 0.0},
    {"name": "Quality Validator", "description": "Validate 50 questions", "icon": "quality_validator.png", "criteria_type": "questions_validated", "criteria_value": 50, "badge_rarity": "uncommon", "badge_frame": "silver", "badge_xp_bonus": 20, "badge_token_reward": 25.0},
    {"name": "Validation Master", "description": "Validate 500 questions", "icon": "validation_master.png", "criteria_type": "questions_validated", "criteria_value": 500, "badge_rarity": "rare", "badge_frame": "gold", "badge_xp_bonus": 50, "badge_token_reward": 100.0},
    {"name": "CCE Contributor", "description": "Earn your first GEEK through CCE", "icon": "cce_contributor.png", "criteria_type": "cce_earnings", "criteria_value": 1, "badge_rarity": "common", "badge_frame": "bronze", "badge_xp_bonus": 5, "badge_token_reward": 0.0},
    {"name": "CCE Expert", "description": "Earn 100 GEEK through CCE", "icon": "cce_expert.png", "criteria_type": "cce_earnings", "criteria_value": 100, "badge_rarity": "uncommon", "badge_frame": "silver", "badge_xp_bonus": 20, "badge_token_reward": 25.0},
    {"name": "CCE Master", "description": "Earn 1000 GEEK through CCE", "icon": "cce_master.png", "criteria_type": "cce_earnings", "criteria_value": 1000, "badge_rarity": "rare", "badge_frame": "gold", "badge_xp_bonus": 50, "badge_token_reward": 100.0},
    {"name": "Trusted Reviewer", "description": "Achieve 95% review accuracy", "icon": "trusted_reviewer.png", "criteria_type": "review_accuracy", "criteria_value": 95, "badge_rarity": "rare", "badge_frame": "gold", "badge_xp_bonus": 40, "badge_token_reward": 50.0},
    {"name": "Content Kingpin", "description": "Have 10 questions reach max earnings", "icon": "content_kingpin.png", "criteria_type": "max_earned_questions", "criteria_value": 10, "badge_rarity": "epic", "badge_frame": "platinum", "badge_xp_bonus": 75, "badge_token_reward": 150.0},
    
    # New Word Challenge Achievements
    {"name": "Word Novice", "description": "Win your first word challenge", "icon": "word_novice.png", "criteria_type": "word_challenge_wins", "criteria_value": 1, "badge_rarity": "common", "badge_frame": "bronze", "badge_xp_bonus": 5, "badge_token_reward": 0.0},
    {"name": "Word Champion", "description": "Win 10 word challenges", "icon": "word_champion.png", "criteria_type": "word_challenge_wins", "criteria_value": 10, "badge_rarity": "uncommon", "badge_frame": "silver", "badge_xp_bonus": 15, "badge_token_reward": 10.0},
    {"name": "Word Master", "description": "Win 50 word challenges", "icon": "word_master.png", "criteria_type": "word_challenge_wins", "criteria_value": 50, "badge_rarity": "rare", "badge_frame": "gold", "badge_xp_bonus": 30, "badge_token_reward": 50.0},
    {"name": "Word Legend", "description": "Win 100 word challenges", "icon": "word_legend.png", "criteria_type": "word_challenge_wins", "criteria_value": 100, "badge_rarity": "epic", "badge_frame": "platinum", "badge_xp_bonus": 75, "badge_token_reward": 100.0},
    {"name": "Bingo!", "description": "Score a bingo (use all 7 tiles in one play)", "icon": "bingo.png", "criteria_type": "word_challenge_bingos", "criteria_value": 1, "badge_rarity": "uncommon", "badge_frame": "silver", "badge_xp_bonus": 20, "badge_token_reward": 15.0},
    {"name": "Bingo Master", "description": "Score 10 bingos", "icon": "bingo_master.png", "criteria_type": "word_challenge_bingos", "criteria_value": 10, "badge_rarity": "rare", "badge_frame": "gold", "badge_xp_bonus": 40, "badge_token_reward": 50.0},
    {"name": "High Scorer", "description": "Score over 300 points in a single challenge", "icon": "high_scorer.png", "criteria_type": "word_challenge_high_score", "criteria_value": 300, "badge_rarity": "rare", "badge_frame": "gold", "badge_xp_bonus": 35, "badge_token_reward": 40.0},
    {"name": "Vocabulary Builder", "description": "Play 50 unique words", "icon": "vocabulary_builder.png", "criteria_type": "word_challenge_unique_words", "criteria_value": 50, "badge_rarity": "uncommon", "badge_frame": "silver", "badge_xp_bonus": 20, "badge_token_reward": 25.0},
    {"name": "Daily Challenger", "description": "Complete a daily challenge", "icon": "daily_challenger.png", "criteria_type": "word_challenge_daily_complete", "criteria_value": 1, "badge_rarity": "common", "badge_frame": "bronze", "badge_xp_bonus": 10, "badge_token_reward": 5.0},
    {"name": "Streak Challenger", "description": "Complete daily challenges for 7 days straight", "icon": "streak_challenger.png", "criteria_type": "word_challenge_daily_streak", "criteria_value": 7, "badge_rarity": "rare", "badge_frame": "gold", "badge_xp_bonus": 50, "badge_token_reward": 75.0}
]

COMBO_ACHIEVEMENTS = [
    {"name": "Combo Starter", "description": "Get a 3x combo", "icon": "combo_starter.png",
     "criteria_type": "combo_3", "criteria_value": 1, "badge_rarity": "common",
     "badge_frame": "bronze", "badge_xp_bonus": 10, "badge_token_reward": 5.0},
    {"name": "Combo Master", "description": "Get a 5x combo", "icon": "combo_master.png",
     "criteria_type": "combo_5", "criteria_value": 1, "badge_rarity": "uncommon",
     "badge_frame": "silver", "badge_xp_bonus": 25, "badge_token_reward": 15.0},
    {"name": "Combo Champion", "description": "Get a 7x combo", "icon": "combo_champion.png",
     "criteria_type": "combo_7", "criteria_value": 1, "badge_rarity": "rare",
     "badge_frame": "gold", "badge_xp_bonus": 50, "badge_token_reward": 30.0},
    {"name": "Combo Legend", "description": "Get a 10x combo", "icon": "combo_legend.png",
     "criteria_type": "combo_10", "criteria_value": 1, "badge_rarity": "epic",
     "badge_frame": "platinum", "badge_xp_bonus": 100, "badge_token_reward": 75.0},
]

# ==================== EXISTING HELPER FUNCTIONS (Keep all your original functions) ====================

def update_streak(user):
    today = datetime.date.today()
    if user.last_login_date:
        days_since_last_login = (today - user.last_login_date).days
        if days_since_last_login == 1:
            user.current_streak += 1
        elif days_since_last_login > 1:
            user.current_streak = 1
    else:
        user.current_streak = 1
    user.last_login_date = today
    if user.current_streak > user.longest_streak:
        user.longest_streak = user.current_streak
    streak_bonus = get_streak_multiplier(user.current_streak)
    user.streak_bonus_multiplier = streak_bonus
    milestone_rewards = user.update_streak_milestones()
    for reward in milestone_rewards:
        user.xp += reward['xp']
        user.geek_balance += reward['geek']
        user.total_earned_geek += reward['geek']
        try:
            milestones_claimed = json.loads(user.streak_milestone_rewards)
            milestones_claimed.append(reward['days'])
            user.streak_milestone_rewards = json.dumps(milestones_claimed)
        except:
            user.streak_milestone_rewards = json.dumps([reward['days']])
        flash(f'🎉 {reward["days"]}-Day Streak Milestone! +{reward["xp"]} XP and +{reward["geek"]} GEEK!', 'success')
    db.session.commit()
    return user.current_streak

TIERED_ACHIEVEMENT_TRACKS = [
    {"track_name": "Quiz Champion Track", "criteria_type": "correct_answers", "tiers": [
        {"tier": "bronze", "order": 1, "name": "Quiz Champion I", "description": "Answer 10 questions correctly", "value": 10, "xp": 5, "geek": 0.0, "packs": 0, "rarity": "common", "frame": "bronze", "animation": "standard"},
        {"tier": "silver", "order": 2, "name": "Quiz Champion II", "description": "Answer 100 questions correctly", "value": 100, "xp": 50, "geek": 5.0, "packs": 1, "rarity": "uncommon", "frame": "silver", "animation": "rare"},
        {"tier": "gold", "order": 3, "name": "Quiz Champion III", "description": "Answer 500 questions correctly", "value": 500, "xp": 200, "geek": 25.0, "packs": 2, "rarity": "rare", "frame": "gold", "animation": "epic"},
        {"tier": "platinum", "order": 4, "name": "Quiz Champion IV", "description": "Answer 2000 questions correctly", "value": 2000, "xp": 1000, "geek": 100.0, "packs": 5, "rarity": "epic", "frame": "platinum", "animation": "legendary"},
    ]},
    {"track_name": "Speed Demon Track", "criteria_type": "under_3s_answers", "tiers": [
        {"tier": "bronze", "order": 1, "name": "Speed Demon I", "description": "Answer any question in under 3 seconds", "value": 1, "xp": 10, "geek": 1.0, "packs": 0, "rarity": "common", "frame": "bronze", "animation": "standard"},
        {"tier": "silver", "order": 2, "name": "Speed Demon II", "description": "Answer 10 questions in under 3 seconds", "value": 10, "xp": 50, "geek": 5.0, "packs": 1, "rarity": "uncommon", "frame": "silver", "animation": "rare"},
        {"tier": "gold", "order": 3, "name": "Speed Demon III", "description": "Answer 50 questions in under 3 seconds", "value": 50, "xp": 200, "geek": 20.0, "packs": 2, "rarity": "rare", "frame": "gold", "animation": "epic"},
        {"tier": "platinum", "order": 4, "name": "Speed Demon IV", "description": "Answer 200 questions in under 3 seconds", "value": 200, "xp": 500, "geek": 75.0, "packs": 4, "rarity": "epic", "frame": "platinum", "animation": "legendary"},
    ]},
    {"track_name": "Streak Warrior Track", "criteria_type": "streak", "tiers": [
        {"tier": "bronze", "order": 1, "name": "Streak Warrior I", "description": "Maintain a 3-day login streak", "value": 3, "xp": 10, "geek": 2.0, "packs": 0, "rarity": "common", "frame": "bronze", "animation": "standard"},
        {"tier": "silver", "order": 2, "name": "Streak Warrior II", "description": "Maintain a 7-day login streak", "value": 7, "xp": 50, "geek": 10.0, "packs": 1, "rarity": "uncommon", "frame": "silver", "animation": "rare"},
        {"tier": "gold", "order": 3, "name": "Streak Warrior III", "description": "Maintain a 30-day login streak", "value": 30, "xp": 200, "geek": 50.0, "packs": 3, "rarity": "rare", "frame": "gold", "animation": "epic"},
        {"tier": "platinum", "order": 4, "name": "Streak Warrior IV", "description": "Maintain a 100-day login streak", "value": 100, "xp": 1000, "geek": 200.0, "packs": 8, "rarity": "epic", "frame": "platinum", "animation": "legendary"},
    ]},
    {"track_name": "Word Wizard Track", "criteria_type": "word_challenge_wins", "tiers": [
        {"tier": "bronze", "order": 1, "name": "Word Wizard I", "description": "Win 1 word challenge", "value": 1, "xp": 15, "geek": 2.0, "packs": 0, "rarity": "common", "frame": "bronze", "animation": "standard"},
        {"tier": "silver", "order": 2, "name": "Word Wizard II", "description": "Win 10 word challenges", "value": 10, "xp": 75, "geek": 15.0, "packs": 1, "rarity": "uncommon", "frame": "silver", "animation": "rare"},
        {"tier": "gold", "order": 3, "name": "Word Wizard III", "description": "Win 50 word challenges", "value": 50, "xp": 300, "geek": 60.0, "packs": 3, "rarity": "rare", "frame": "gold", "animation": "epic"},
        {"tier": "platinum", "order": 4, "name": "Word Wizard IV", "description": "Win 200 word challenges", "value": 200, "xp": 1500, "geek": 250.0, "packs": 10, "rarity": "epic", "frame": "platinum", "animation": "legendary"},
    ]},
    {"track_name": "Bingo Master Track", "criteria_type": "word_challenge_bingos", "tiers": [
        {"tier": "bronze", "order": 1, "name": "Bingo Master I", "description": "Score 1 bingo", "value": 1, "xp": 25, "geek": 5.0, "packs": 1, "rarity": "uncommon", "frame": "silver", "animation": "rare"},
        {"tier": "silver", "order": 2, "name": "Bingo Master II", "description": "Score 5 bingos", "value": 5, "xp": 100, "geek": 20.0, "packs": 2, "rarity": "rare", "frame": "silver", "animation": "rare"},
        {"tier": "gold", "order": 3, "name": "Bingo Master III", "description": "Score 25 bingos", "value": 25, "xp": 400, "geek": 80.0, "packs": 4, "rarity": "epic", "frame": "gold", "animation": "epic"},
        {"tier": "platinum", "order": 4, "name": "Bingo Master IV", "description": "Score 100 bingos", "value": 100, "xp": 2000, "geek": 300.0, "packs": 12, "rarity": "legendary", "frame": "platinum", "animation": "legendary"},
    ]},
    {"track_name": "Knowledge Creator Track", "criteria_type": "questions_submitted", "tiers": [
        {"tier": "bronze", "order": 1, "name": "Knowledge Creator I", "description": "Submit 1 question", "value": 1, "xp": 20, "geek": 3.0, "packs": 0, "rarity": "common", "frame": "bronze", "animation": "standard"},
        {"tier": "silver", "order": 2, "name": "Knowledge Creator II", "description": "Submit 5 questions", "value": 5, "xp": 100, "geek": 25.0, "packs": 2, "rarity": "uncommon", "frame": "silver", "animation": "rare"},
        {"tier": "gold", "order": 3, "name": "Knowledge Creator III", "description": "Submit 25 questions", "value": 25, "xp": 500, "geek": 100.0, "packs": 5, "rarity": "rare", "frame": "gold", "animation": "epic"},
        {"tier": "platinum", "order": 4, "name": "Knowledge Creator IV", "description": "Submit 100 questions", "value": 100, "xp": 2500, "geek": 400.0, "packs": 15, "rarity": "epic", "frame": "platinum", "animation": "legendary"},
    ]},
    {"track_name": "Gauntlet Legend Track", "criteria_type": "gauntlet_round", "tiers": [
        {"tier": "bronze", "order": 1, "name": "Gauntlet Legend I", "description": "Complete Gauntlet Round 1", "value": 1, "xp": 10, "geek": 1.0, "packs": 0, "rarity": "common", "frame": "bronze", "animation": "standard"},
        {"tier": "silver", "order": 2, "name": "Gauntlet Legend II", "description": "Complete Gauntlet Round 5", "value": 5, "xp": 100, "geek": 20.0, "packs": 2, "rarity": "uncommon", "frame": "silver", "animation": "rare"},
        {"tier": "gold", "order": 3, "name": "Gauntlet Legend III", "description": "Complete Gauntlet Round 8", "value": 8, "xp": 400, "geek": 75.0, "packs": 4, "rarity": "rare", "frame": "gold", "animation": "epic"},
        {"tier": "platinum", "order": 4, "name": "Gauntlet Legend IV", "description": "Complete Gauntlet Round 10", "value": 10, "xp": 2000, "geek": 300.0, "packs": 12, "rarity": "epic", "frame": "platinum", "animation": "legendary"},
    ]},
    {"track_name": "Level Ascendant Track", "criteria_type": "level", "tiers": [
        {"tier": "bronze", "order": 1, "name": "Level Ascendant I", "description": "Reach Level 10", "value": 10, "xp": 50, "geek": 10.0, "packs": 1, "rarity": "common", "frame": "bronze", "animation": "standard"},
        {"tier": "silver", "order": 2, "name": "Level Ascendant II", "description": "Reach Level 25", "value": 25, "xp": 200, "geek": 40.0, "packs": 3, "rarity": "uncommon", "frame": "silver", "animation": "rare"},
        {"tier": "gold", "order": 3, "name": "Level Ascendant III", "description": "Reach Level 50", "value": 50, "xp": 750, "geek": 150.0, "packs": 6, "rarity": "rare", "frame": "gold", "animation": "epic"},
        {"tier": "platinum", "order": 4, "name": "Level Ascendant IV", "description": "Reach Level 100", "value": 100, "xp": 5000, "geek": 1000.0, "packs": 25, "rarity": "legendary", "frame": "platinum", "animation": "legendary"},
    ]},
]

SECRET_ACHIEVEMENTS = [
    {"name": "Nightowl", "description": "Answer 5 correct questions between midnight and 5am", "criteria_type": "nightowl_correct", "criteria_value": 5},
    {"name": "Comeback King", "description": "Win a word challenge after being 100+ points behind", "criteria_type": "word_challenge_comeback", "criteria_value": 1},
    {"name": "Perfectionist", "description": "Get 10 correct answers in a row with average time under 5 seconds", "criteria_type": "perfect_streak_10", "criteria_value": 1},
    {"name": "Generous Geek", "description": "Have a question earn over 500 GEEK for its creator", "criteria_type": "creator_500_geek", "criteria_value": 1},
    {"name": "Marathon Runner", "description": "Play for 3+ hours in a single session", "criteria_type": "session_3h", "criteria_value": 1},
]

def _achievement_reward_values(achievement):
    xp_reward = achievement.xp_reward if achievement.xp_reward else achievement.badge_xp_bonus
    geek_reward = achievement.geek_reward if achievement.geek_reward else achievement.badge_token_reward
    return xp_reward or 0, geek_reward or 0.0

def seed_tiered_achievements():
    for track in TIERED_ACHIEVEMENT_TRACKS:
        prev = None
        for tier in track["tiers"]:
            achievement = Achievement.query.filter_by(name=tier["name"]).first()
            if not achievement:
                achievement = Achievement(
                    name=tier["name"],
                    description=tier["description"],
                    icon=f"{tier['name'].lower().replace(' ', '_')}.png",
                    criteria_type=track["criteria_type"],
                    criteria_value=tier["value"]
                )
                db.session.add(achievement)
                db.session.flush()
            achievement.description = tier["description"]
            achievement.criteria_type = track["criteria_type"]
            achievement.criteria_value = tier["value"]
            achievement.badge_rarity = tier["rarity"]
            achievement.badge_frame = tier["frame"]
            achievement.tier = tier["tier"]
            achievement.tier_order = tier["order"]
            achievement.track_name = track["track_name"]
            achievement.is_hidden = 'false'
            achievement.is_secret = False
            achievement.unlock_animation = tier["animation"]
            achievement.xp_reward = tier["xp"]
            achievement.geek_reward = tier["geek"]
            achievement.sticker_pack_reward = tier["packs"]
            achievement.prerequisite_achievement_id = prev.id if prev else None
            prev = achievement

    for secret in SECRET_ACHIEVEMENTS:
        achievement = Achievement.query.filter_by(name=secret["name"]).first()
        if not achievement:
            achievement = Achievement(
                name=secret["name"],
                description=secret["description"],
                icon=f"{secret['name'].lower().replace(' ', '_')}.png",
                criteria_type=secret["criteria_type"],
                criteria_value=secret["criteria_value"],
                badge_rarity='legendary',
                badge_frame='platinum',
                tier='platinum',
                tier_order=4,
                track_name='Secret Track',
                is_hidden='true',
                is_secret=True,
                unlock_animation='legendary',
                xp_reward=750,
                geek_reward=100.0,
                sticker_pack_reward=2
            )
            db.session.add(achievement)
    db.session.commit()

def check_achievements(user, achievement_type=None, value=None, context_data=None):
    """
    Check and award achievements with tier progression.
    Returns list of dict items: {'achievement': Achievement, 'is_hidden_reveal': bool, 'animation_type': str}
    """
    if achievement_type is None or value is None:
        return []

    context_data = context_data or {}
    newly_unlocked = []
    user_achievement_map = {
        ua.achievement_id: ua for ua in UserAchievement.query.filter_by(user_id=user.id).all()
    }

    relevant_achievements = Achievement.query.filter_by(criteria_type=achievement_type).order_by(Achievement.tier_order.asc()).all()
    if not relevant_achievements:
        return []

    for achievement in relevant_achievements:
        if value < achievement.criteria_value:
            continue
        if achievement.id in user_achievement_map:
            continue
        if achievement.prerequisite_achievement_id and achievement.prerequisite_achievement_id not in user_achievement_map:
            continue

        user_ach = UserAchievement(
            user_id=user.id,
            achievement_id=achievement.id,
            tier_reached=achievement.tier or 'bronze',
            was_hidden=bool(achievement.is_secret),
            notification_shown=False
        )
        db.session.add(user_ach)
        user_achievement_map[achievement.id] = user_ach

        xp_reward, geek_reward = _achievement_reward_values(achievement)
        user.xp += xp_reward
        user.geek_balance += geek_reward
        user.total_earned_geek += geek_reward

        packs_to_award = achievement.sticker_pack_reward or 0
        if packs_to_award > 0:
            for _ in range(packs_to_award):
                db.session.add(StickerPack(
                    user_id=user.id,
                    pack_type='premium' if (achievement.tier in ['gold', 'platinum']) else 'standard',
                    source='achievement',
                    source_detail=f"{achievement.track_name or achievement.name} ({achievement.tier or 'bronze'})",
                    stickers_per_pack=5,
                    guaranteed_rarity='rare' if achievement.tier == 'platinum' else None
                ))
            pending = session.get('pending_sticker_packs', 0)
            session['pending_sticker_packs'] = pending + packs_to_award
            pack_history = session.get('pack_award_history', [])
            pack_history.append({
                'achievement_name': achievement.name,
                'packs': packs_to_award,
                'tier': achievement.tier or 'bronze'
            })
            session['pack_award_history'] = pack_history

        newly_unlocked.append({
            'achievement': achievement,
            'is_hidden_reveal': bool(achievement.is_secret),
            'animation_type': achievement.unlock_animation or 'standard'
        })

        if achievement.tier == 'platinum':
            user.add_character_interaction('GIGA', 'achievement_unlocked', {
                'achievement_name': achievement.name,
                'tier': 'platinum'
            })

    if newly_unlocked:
        pending_achievements = session.get('pending_achievement_notifications', [])
        for item in newly_unlocked:
            ach = item['achievement']
            xp_reward, geek_reward = _achievement_reward_values(ach)
            pending_achievements.append({
                'id': ach.id,
                'name': ach.name if not item['is_hidden_reveal'] else 'SECRET ACHIEVEMENT UNLOCKED!',
                'description': ach.description if not item['is_hidden_reveal'] else 'You discovered a hidden achievement!',
                'tier': ach.tier or 'bronze',
                'animation': item['animation_type'],
                'xp': xp_reward,
                'geek': geek_reward
            })
        session['pending_achievement_notifications'] = pending_achievements
        db.session.commit()

    return newly_unlocked

def get_unlocked_achievement_objects(unlocked_items):
    if not unlocked_items:
        return []
    normalized = []
    for item in unlocked_items:
        if isinstance(item, Achievement):
            normalized.append(item)
        elif isinstance(item, dict) and item.get('achievement'):
            normalized.append(item['achievement'])
    return normalized

def add_combo_achievements():
    for achievement_data in COMBO_ACHIEVEMENTS:
        existing = Achievement.query.filter_by(name=achievement_data['name']).first()
        if not existing:
            achievement = Achievement(**achievement_data)
            db.session.add(achievement)
    db.session.commit()
    print("✅ Combo achievements added to database")

def get_streak_multiplier(streak):
    if streak >= 100:
        return 2.0
    elif streak >= 30:
        return 1.5
    elif streak >= 7:
        return 1.2
    else:
        return 1.0

def award_validation_points(validator_id, question_id, action, review_time=0.0, detailed_feedback=None):
    points = 5 if action == 'approved' else 2
    validation = QuestionValidation(
        question_id=question_id,
        validator_id=validator_id,
        action=action,
        points_awarded=points,
        geek_awarded=CCE_REVIEW_REWARD_GEEK,
        review_time=review_time,
        detailed_feedback=detailed_feedback
    )
    db.session.add(validation)
    validator = User.query.get(validator_id)
    validator.points += points
    validator.geek_balance += CCE_REVIEW_REWARD_GEEK
    validator.total_earned_geek += CCE_REVIEW_REWARD_GEEK
    validator.reviews_completed += 1
    validator.xp += CCE_REVIEW_XP_REWARD
    check_achievements(validator, 'cce_earnings', validator.total_earned_geek)
    db.session.commit()
    return points, CCE_REVIEW_REWARD_GEEK

def award_question_creation_points(creator_id, question_id):
    points = 10
    creator = User.query.get(creator_id)
    creator.points += points
    creator.questions_approved += 1
    total_submitted = creator.questions_submitted
    if total_submitted > 0:
        approval_rate = creator.questions_approved / total_submitted
        creator.reputation_score = 50 + (approval_rate * 50)
    total_submitted = Question.query.filter_by(created_by=creator_id).count()
    check_achievements(creator, 'questions_submitted', total_submitted)
    db.session.commit()
    return points

def get_sticker_kaspa_cost(rarity):
    costs = {
        'common': 0.5,
        'uncommon': 1.0,
        'rare': 2.5,
        'epic': 5.0,
        'legendary': 10.0
    }
    return costs.get(rarity, 1.0)

def get_sticker_geek_cost(rarity):
    return float(STICKER_GEEK_PRICES.get((rarity or 'common').lower(), STICKER_GEEK_PRICES['common']))

def get_sticker_geek_value(rarity):
    """Assigned GEEK value for a sticker (used for trading/cashout valuation)."""
    values = {
        'common': 5.0,
        'uncommon': 12.5,
        'rare': 30.0,
        'epic': 75.0,
        'legendary': 150.0
    }
    return values.get(rarity, 5.0)

def get_economy_config():
    config = EconomyConfig.query.order_by(EconomyConfig.updated_at.desc()).first()
    if not config:
        config = EconomyConfig(
            points_per_geek=DEFAULT_POINTS_PER_GEEK,
            minimum_points=DEFAULT_MIN_CONVERSION_POINTS,
            exchange_listing_expiry_hours=DEFAULT_EXCHANGE_EXPIRY_HOURS
        )
        db.session.add(config)
        db.session.commit()
    return config

def notify_user(user_id, title, message, category='exchange'):
    db.session.add(UserNotification(
        user_id=user_id,
        title=title,
        message=message,
        category=category,
        is_read=False
    ))

def list_to_json(values):
    return json.dumps(values or [])

def json_to_int_list(raw_value):
    if not raw_value:
        return []
    try:
        parsed = json.loads(raw_value)
    except Exception:
        return []
    out = []
    for item in parsed:
        try:
            out.append(int(item))
        except Exception:
            continue
    return out

def get_user_unique_owned_count(user_id):
    return db.session.query(
        db.func.count(db.distinct(UserSticker.sticker_id))
    ).filter(
        UserSticker.user_id == user_id,
        UserSticker.is_duplicate == False
    ).scalar() or 0

def verify_user_sticker_integrity(user):
    duplicate_primaries = db.session.query(
        UserSticker.sticker_id,
        db.func.count(UserSticker.id).label('c')
    ).filter(
        UserSticker.user_id == user.id,
        UserSticker.is_duplicate == False
    ).group_by(UserSticker.sticker_id).having(db.func.count(UserSticker.id) > 1).all()

    invalid_links = db.session.query(UserSticker.id).outerjoin(
        Sticker, Sticker.id == UserSticker.sticker_id
    ).filter(
        UserSticker.user_id == user.id,
        Sticker.id.is_(None)
    ).count()

    if duplicate_primaries or invalid_links:
        app.logger.warning(
            "Sticker integrity warning for user %s: duplicate_primaries=%s invalid_links=%s",
            user.id,
            len(duplicate_primaries),
            invalid_links
        )

def expire_exchange_listings():
    now = datetime.datetime.utcnow()
    expired = ExchangeListing.query.filter(
        ExchangeListing.status == 'active',
        ExchangeListing.expires_at <= now
    ).all()
    for listing in expired:
        listing.status = 'expired'
        listing.completed_at = now
        offers = ExchangeOffer.query.filter_by(listing_id=listing.id, status='pending').all()
        for offer in offers:
            offer.status = 'declined'
            offer.responded_at = now
        notify_user(
            listing.seller_id,
            'Exchange Listing Expired',
            f'Your listing for sticker #{listing.sticker_id} expired and returned to unlisted state.'
        )
    if expired:
        db.session.commit()

def push_db_notifications_to_session():
    if not current_user.is_authenticated:
        return
    unread = UserNotification.query.filter_by(user_id=current_user.id, is_read=False).order_by(UserNotification.created_at.asc()).all()
    if not unread:
        return
    pending = session.get('pending_notifications', [])
    for item in unread:
        pending.append({
            'title': item.title,
            'message': item.message,
            'animation': item.category or 'standard'
        })
        item.is_read = True
    session['pending_notifications'] = pending
    db.session.commit()

def get_dust_value(rarity):
    return DUST_VALUES.get(rarity, 5)

def award_dust_for_duplicate(user_id, sticker):
    amount = get_dust_value(sticker.rarity)
    dust = GeekDust.get_or_create(user_id, commit=False)
    dust.amount += amount
    dust.total_earned += amount
    dust.updated_at = datetime.datetime.utcnow()

    transaction = DustTransaction(
        user_id=user_id,
        amount=amount,
        reason=f'Duplicate: {sticker.name}',
        sticker_id=sticker.id
    )
    db.session.add(transaction)
    return amount

def generate_pack_contents(pack_type='standard', series_id=None, guaranteed_rarity=None):
    """Generate 5 stickers for a pack with weighted rarity distribution."""
    rarity_weights = {
        'standard': {'common': 60, 'uncommon': 28, 'rare': 9, 'epic': 2.5, 'legendary': 0.5},
        'premium': {'common': 40, 'uncommon': 35, 'rare': 17, 'epic': 6, 'legendary': 2},
        'legendary': {'common': 10, 'uncommon': 25, 'rare': 35, 'epic': 22, 'legendary': 8},
        'series_specific': {'common': 50, 'uncommon': 30, 'rare': 14, 'epic': 5, 'legendary': 1},
    }

    weights = rarity_weights.get(pack_type, rarity_weights['standard'])
    rarities = list(weights.keys())
    odds = list(weights.values())

    chosen_stickers = []
    for i in range(5):
        if i == 4 and not any(s['rarity'] in ['uncommon', 'rare', 'epic', 'legendary'] for s in chosen_stickers):
            slot_rarities = ['uncommon', 'rare', 'epic', 'legendary']
            slot_odds = [weights['uncommon'], weights['rare'], weights['epic'], weights['legendary']]
        elif guaranteed_rarity and i == 0:
            slot_rarities = [guaranteed_rarity]
            slot_odds = [1]
        else:
            slot_rarities = rarities
            slot_odds = odds

        chosen_rarity = random.choices(slot_rarities, weights=slot_odds, k=1)[0]

        query = Sticker.query.filter_by(rarity=chosen_rarity)
        if series_id:
            query = query.filter_by(series_id=series_id)
        sticker = query.order_by(db.func.random()).first()
        if not sticker:
            sticker = Sticker.query.filter_by(rarity='common').order_by(db.func.random()).first()

        if sticker:
            chosen_stickers.append({
                'sticker_id': sticker.id,
                'name': sticker.name,
                'rarity': sticker.rarity,
                'series_id': sticker.series_id,
                'number': sticker.number
            })

    # Safety fallback: never return empty slots.
    while len(chosen_stickers) < 5:
        fallback = Sticker.query.filter_by(rarity='common').order_by(db.func.random()).first()
        if not fallback:
            break
        chosen_stickers.append({
            'sticker_id': fallback.id,
            'name': fallback.name,
            'rarity': fallback.rarity,
            'series_id': fallback.series_id,
            'number': fallback.number
        })

    return chosen_stickers

def _check_series_completion(user, series_id):
    """Check if user just completed a series and award bonuses once."""
    if not series_id:
        return

    series = StickerSeries.query.get(series_id)
    if not series:
        return

    already_completed = SeriesCompletion.query.filter_by(user_id=user.id, series_id=series_id).first()
    if already_completed:
        return

    all_sticker_ids = {s.id for s in Sticker.query.filter_by(series_id=series_id).all()}
    if not all_sticker_ids:
        return

    owned_ids = {us.sticker_id for us in UserSticker.query.filter_by(user_id=user.id, is_duplicate=False).all()}
    if not all_sticker_ids.issubset(owned_ids):
        return

    db.session.add(SeriesCompletion(user_id=user.id, series_id=series_id))
    db.session.add(StickerPack(
        user_id=user.id,
        pack_type='legendary',
        source='series_completion',
        source_detail=f'Completed: {series.name}',
        stickers_per_pack=5,
        guaranteed_rarity='epic'
    ))

    completion_bonus_geek = len(all_sticker_ids) * 0.5
    user.geek_balance += completion_bonus_geek
    user.total_earned_geek += completion_bonus_geek

    notifs = session.get('pending_notifications', [])
    notifs.append({
        'type': 'series_complete',
        'title': f'🎉 Series Complete: {series.name}!',
        'message': f'You collected all {len(all_sticker_ids)} stickers! +1 Legendary Pack, +{completion_bonus_geek:.1f} GEEK!',
        'animation': 'legendary'
    })
    session['pending_notifications'] = notifs

STICKER_EMOJI_BY_KEYWORD = {
    'ai': '🤖', 'robot': '🤖', 'cyber': '🧠', 'code': '💻', 'python': '🐍',
    'java': '☕', 'javascript': '🟨', 'rust': '🦀', 'linux': '🐧', 'cloud': '☁️',
    'data': '📊', 'crypto': '🪙', 'blockchain': '⛓️', 'nft': '🖼️',
    'hacker': '🕶️', 'security': '🛡️', 'challenge': '🎮', 'challenger': '🕹️',
    'arcade': '👾', 'rpg': '⚔️', 'chess': '♟️', 'puzzle': '🧩',
    'science': '🔬', 'physics': '⚛️', 'chem': '🧪', 'math': '➗',
    'space': '🚀', 'astro': '🌌', 'planet': '🪐', 'star': '⭐',
    'music': '🎵', 'guitar': '🎸', 'piano': '🎹', 'art': '🎨',
    'design': '🖌️', 'photo': '📷', 'camera': '📸', 'film': '🎬',
    'cinema': '🎥', 'anime': '🌸', 'manga': '📚', 'comic': '🦸',
    'super': '🦸', 'fantasy': '🐉', 'dragon': '🐲', 'wizard': '🧙',
    'book': '📖', 'history': '🏛️', 'food': '🍜', 'coffee': '☕',
    'fitness': '🏋️', 'yoga': '🧘', 'travel': '🧳', 'drone': '🛸',
    'keyboard': '⌨️', 'home': '🏠', 'finance': '💰', 'geek': '🤓'
}

STICKER_EMOJI_FALLBACK = ['🎯', '🚀', '🔥', '⚡', '💎', '🌟', '🎮', '🧠', '🛠️', '🏆', '🧩', '📚']

def get_sticker_emoji(sticker_name, sticker_number=None, rarity='common'):
    """Resolve a real emoji for any sticker name."""
    name = (sticker_name or '').lower()
    for keyword, emoji in STICKER_EMOJI_BY_KEYWORD.items():
        if keyword in name:
            return emoji

    rarity_fallback = {
        'common': '🎫',
        'uncommon': '✨',
        'rare': '💠',
        'epic': '🌈',
        'legendary': '👑'
    }
    if sticker_number is None:
        return rarity_fallback.get(rarity, '🎟️')
    return STICKER_EMOJI_FALLBACK[(sticker_number - 1) % len(STICKER_EMOJI_FALLBACK)]

STICKER_CRITERIA_ROTATION = [
    ('daily_login', 'Daily Login Days'),
    ('streak_days', 'Current Streak Days'),
    ('level_reached', 'Player Level'),
    ('quiz_correct', 'Correct Quiz Answers'),
    ('word_challenge_wins', 'Word Challenge Wins'),
    ('word_challenge_bingos', 'Word Challenge Bingos'),
    ('questions_submitted', 'Questions Submitted'),
    ('reviews_completed', 'Reviews Completed'),
    ('total_geek_earned', 'Total GEEK Earned'),
    ('word_challenge_total_score', 'Word Challenge Total Score')
]

STICKER_CRITERIA_TIERS = {
    'daily_login': [1, 2, 3, 5, 7, 10, 14, 21, 30, 45],
    'streak_days': [2, 3, 5, 7, 10, 14, 21, 30, 60, 100],
    'level_reached': [2, 3, 5, 7, 10, 15, 20, 30, 50, 75],
    'quiz_correct': [5, 10, 25, 50, 100, 200, 350, 500, 800, 1200],
    'word_challenge_wins': [1, 2, 3, 5, 8, 12, 20, 35, 50, 75],
    'word_challenge_bingos': [1, 1, 2, 3, 4, 5, 8, 12, 16, 20],
    'questions_submitted': [1, 2, 3, 5, 8, 12, 20, 30, 50, 75],
    'reviews_completed': [1, 3, 5, 10, 20, 35, 50, 80, 120, 160],
    'total_geek_earned': [5, 10, 20, 35, 50, 75, 100, 150, 250, 400],
    'word_challenge_total_score': [50, 100, 200, 350, 500, 750, 1000, 1500, 2200, 3000]
}

def get_sticker_criteria(sticker_number):
    """Deterministic milestone criteria for each sticker number."""
    criterion_type, label = STICKER_CRITERIA_ROTATION[(sticker_number - 1) % len(STICKER_CRITERIA_ROTATION)]
    tier = min((sticker_number - 1) // 50, 9)
    required = STICKER_CRITERIA_TIERS[criterion_type][tier]
    return {
        'type': criterion_type,
        'label': label,
        'required': required
    }

def get_user_sticker_metrics(user):
    """Gather user metrics once for sticker milestone evaluation."""
    login_days = db.session.query(
        db.func.count(db.func.distinct(db.func.date(CharacterInteraction.timestamp)))
    ).filter(
        CharacterInteraction.user_id == user.id,
        CharacterInteraction.interaction_type.in_(['login', 'streak_login'])
    ).scalar() or 0

    quiz_correct = Attempt.query.filter_by(user_id=user.id, is_correct=True).count()

    return {
        'daily_login': login_days,
        'streak_days': user.current_streak or 0,
        'level_reached': user.level or 1,
        'quiz_correct': quiz_correct,
        'word_challenge_wins': user.word_challenge_wins or 0,
        'word_challenge_bingos': user.word_challenge_bingos or 0,
        'questions_submitted': user.questions_submitted or 0,
        'reviews_completed': user.reviews_completed or 0,
        'total_geek_earned': user.total_earned_geek or 0.0,
        'word_challenge_total_score': user.word_challenge_total_score or 0
    }

def user_meets_sticker_criteria(metrics, criteria):
    value = metrics.get(criteria['type'], 0)
    return value >= criteria['required']

def award_criteria_stickers(user, max_awards=2):
    """Award milestone-earned stickers (non-daily) up to max_awards."""
    owned_ids = {us.sticker_id for us in UserSticker.query.filter_by(user_id=user.id).all()}
    metrics = get_user_sticker_metrics(user)
    stickers = Sticker.query.order_by(Sticker.number.asc(), Sticker.id.asc()).all()
    awarded = []

    for sticker in stickers:
        if sticker.id in owned_ids:
            continue

        criteria = get_sticker_criteria(sticker.number)
        if criteria['type'] == 'daily_login':
            continue

        if user_meets_sticker_criteria(metrics, criteria):
            db.session.add(UserSticker(user_id=user.id, sticker_id=sticker.id, is_duplicate=False))
            owned_ids.add(sticker.id)
            awarded.append(sticker)
            if len(awarded) >= max_awards:
                break

    if awarded:
        db.session.commit()
    return awarded

def award_daily_login_sticker(user):
    """Award one daily login sticker per UTC day if user qualifies."""
    today = datetime.datetime.utcnow().date()
    already_awarded = CharacterInteraction.query.filter(
        CharacterInteraction.user_id == user.id,
        CharacterInteraction.interaction_type == 'daily_login_sticker_award',
        db.func.date(CharacterInteraction.timestamp) == today
    ).first()

    if already_awarded:
        return None

    owned_ids = {us.sticker_id for us in UserSticker.query.filter_by(user_id=user.id).all()}
    metrics = get_user_sticker_metrics(user)
    stickers = Sticker.query.order_by(Sticker.number.asc(), Sticker.id.asc()).all()

    selected = None
    for sticker in stickers:
        if sticker.id in owned_ids:
            continue
        criteria = get_sticker_criteria(sticker.number)
        if criteria['type'] == 'daily_login' and user_meets_sticker_criteria(metrics, criteria):
            selected = sticker
            break

    if not selected:
        return None

    db.session.add(UserSticker(user_id=user.id, sticker_id=selected.id, is_duplicate=False))
    db.session.add(CharacterInteraction(
        user_id=user.id,
        character='GIGA',
        interaction_type='daily_login_sticker_award',
        message=f"Daily login sticker awarded: {selected.name}",
        context='daily_sticker'
    ))
    db.session.commit()
    return selected

def get_unowned_stickers(user_id, limit_count):
    owned_subquery = db.session.query(UserSticker.sticker_id).filter_by(user_id=user_id)
    return Sticker.query.filter(~Sticker.id.in_(owned_subquery))\
        .order_by(Sticker.number.asc(), Sticker.id.asc())\
        .limit(limit_count).all()

def award_creator_earnings(question_id, amount, session_id=None, player_id=None):
    question = Question.query.get(question_id)
    if not question:
        return False
    question.total_serves += 1
    question.date_last_served = datetime.datetime.utcnow()
    if not question.date_first_served:
        question.date_first_served = datetime.datetime.utcnow()
    if question.total_earned >= CCE_MAX_EARNINGS_PER_QUESTION:
        return False
    remaining = CCE_MAX_EARNINGS_PER_QUESTION - question.total_earned
    actual_amount = min(amount, remaining)
    earning = CreatorEarning(
        creator_id=question.created_by,
        question_id=question_id,
        amount=actual_amount,
        session_id=session_id,
        player_id=player_id
    )
    db.session.add(earning)
    question.total_earned += actual_amount
    creator = User.query.get(question.created_by)
    creator.geek_balance += actual_amount
    creator.total_earned_geek += actual_amount
    if question.total_earned >= CCE_MAX_EARNINGS_PER_QUESTION:
        creator_max_earned = Question.query.filter_by(
            created_by=creator.id,
            total_earned=CCE_MAX_EARNINGS_PER_QUESTION
        ).count()
        check_achievements(creator, 'max_earned_questions', creator_max_earned)
    check_achievements(creator, 'cce_earnings', creator.total_earned_geek)
    db.session.commit()
    return True

def add_to_review_queue(question_id):
    existing = ReviewQueue.query.filter_by(question_id=question_id).first()
    if not existing:
        queue_entry = ReviewQueue(question_id=question_id)
        db.session.add(queue_entry)
        db.session.commit()

def get_next_review_for_user(user_id):
    reviewed_question_ids = [v.question_id for v in
                           QuestionValidation.query.filter_by(validator_id=user_id).all()]
    user_reviews = QuestionValidation.query.filter_by(validator_id=user_id).all()
    query = ReviewQueue.query.join(Question).filter(
        Question.status == 'pending',
        ~ReviewQueue.question_id.in_(reviewed_question_ids)
    )
    queue_entry = query.order_by(
        ReviewQueue.priority.desc(),
        ReviewQueue.last_shown
    ).first()
    if queue_entry:
        queue_entry.last_shown = datetime.datetime.utcnow()
        db.session.commit()
        return queue_entry.question
    question = Question.query.filter(
        Question.status == 'pending',
        ~Question.id.in_(reviewed_question_ids)
    ).first()
    return question

def update_question_metrics(question_id, time_taken, was_skipped=False, rating=None):
    question = Question.query.get(question_id)
    if not question:
        return
    if question.total_serves > 0:
        current_avg = question.average_time_to_answer
        new_avg = ((current_avg * (question.total_serves - 1)) + time_taken) / question.total_serves
        question.average_time_to_answer = new_avg
    if was_skipped:
        question.skip_rate = ((question.skip_rate * (question.total_serves - 1)) + 1) / question.total_serves
    else:
        question.skip_rate = (question.skip_rate * (question.total_serves - 1)) / question.total_serves
    if rating and 1 <= rating <= 5:
        if question.player_rating == 0:
            question.player_rating = rating
        else:
            question.player_rating = (question.player_rating * 0.7) + (rating * 0.3)
    db.session.commit()

def update_reviewer_accuracy(validator_id):
    validator = User.query.get(validator_id)
    if not validator:
        return
    reviews = QuestionValidation.query.filter_by(validator_id=validator_id).all()
    if not reviews:
        return
    correct_reviews = 0
    total_reviews = len(reviews)
    for review in reviews:
        question = Question.query.get(review.question_id)
        if question and question.status != 'pending':
            if (review.action == 'approved' and question.status == 'approved') or \
               (review.action == 'rejected' and question.status == 'rejected'):
                correct_reviews += 1
    if total_reviews > 0:
        accuracy = (correct_reviews / total_reviews) * 100
        validator.review_accuracy = accuracy
        check_achievements(validator, 'review_accuracy', accuracy)
    db.session.commit()

def check_question_approval_status(question_id):
    question = Question.query.get(question_id)
    if not question:
        return False
    approvals = QuestionValidation.query.filter_by(
        question_id=question_id,
        action='approved'
    ).count()
    if approvals >= CCE_APPROVALS_NEEDED:
        question.status = 'approved'
        question.approvals_count = approvals
        question.date_approved = datetime.datetime.utcnow()
        award_question_creation_points(question.created_by, question_id)
        reviews = QuestionValidation.query.filter_by(question_id=question_id).all()
        for review in reviews:
            update_reviewer_accuracy(review.validator_id)
        ReviewQueue.query.filter_by(question_id=question_id).delete()
        db.session.commit()
        creator = User.query.get(question.created_by)
        print(f"Question {question_id} approved! Creator {creator.email} notified.")
        return True
    rejects = QuestionValidation.query.filter_by(
        question_id=question_id,
        action='rejected'
    ).count()
    if rejects >= 3:
        question.status = 'rejected'
        question.rejections_count = rejects
        creator = User.query.get(question.created_by)
        creator.questions_rejected += 1
        reviews = QuestionValidation.query.filter_by(question_id=question_id).all()
        for review in reviews:
            update_reviewer_accuracy(review.validator_id)
        ReviewQueue.query.filter_by(question_id=question_id).delete()
        db.session.commit()
        return True
    return False

def get_level_progression():
    levels = []
    for level in range(1, 101):
        xp_required = User().calculate_xp_required(level)
        levels.append({
            'level': level,
            'xp_required': xp_required,
            'xp_difference': xp_required - (User().calculate_xp_required(level-1) if level > 1 else 0)
        })
    return levels

def get_user_topics_preferences(user_id):
    if 'selected_topics' in session:
        selected_topics = session['selected_topics']
        if isinstance(selected_topics, str):
            try:
                selected_topics = json.loads(selected_topics)
            except (TypeError, ValueError):
                selected_topics = []

        active_topic_ids = {topic.id for topic in Topic.query.filter_by(is_active=True).all()}
        filtered = []
        for topic_id in selected_topics:
            try:
                topic_id_int = int(topic_id)
            except (TypeError, ValueError):
                continue
            if topic_id_int in active_topic_ids:
                filtered.append(topic_id_int)

        # Keep session preferences clean if inactive topics were removed.
        if filtered != selected_topics:
            session['selected_topics'] = filtered
        return filtered
    topics = Topic.query.filter_by(is_active=True).all()
    return [cat.id for cat in topics]

def get_questions_for_round(round_number, selected_topics=None):
    if round_number < 1 or round_number > len(GAUNTLET_ROUNDS):
        return []

    round_info = GAUNTLET_ROUNDS[round_number - 1]
    difficulty = round_info['difficulty']
    questions_needed = round_info['questions']

    used_questions = session.get('round_questions', []) if 'round_questions' in session else []

    query = Question.query.filter_by(status='approved')
    if '-' in difficulty:
        difficulties = difficulty.split('-')
        query = query.filter(Question.difficulty.in_(difficulties))
    else:
        query = query.filter_by(difficulty=difficulty)

    if selected_topics and len(selected_topics) > 0:
        query = query.filter(Question.topic_id.in_(selected_topics))

    if used_questions:
        unused_query = query.filter(~Question.id.in_(used_questions))
        unused_questions = unused_query.all()
        if len(unused_questions) >= questions_needed:
            unused_questions.sort(key=lambda x: (x.total_serves, random.random()))
            return unused_questions[:questions_needed]

        if len(unused_questions) > 0:
            all_questions = query.all()
            final_questions = []
            used_set = set(used_questions)

            for q in all_questions:
                if q.id not in used_set and q not in final_questions:
                    final_questions.append(q)

            used_questions_list = [q for q in all_questions if q.id in used_set and q not in final_questions]
            used_questions_list.sort(key=lambda x: (x.total_serves, random.random()))

            while len(final_questions) < questions_needed and used_questions_list:
                final_questions.append(used_questions_list.pop(0))

            session['is_recycled'] = True
            return final_questions[:questions_needed]

    questions = query.all()
    if len(questions) < questions_needed:
        query = Question.query.filter_by(status='approved')
        if selected_topics and len(selected_topics) > 0:
            query = query.filter(Question.topic_id.in_(selected_topics))
        questions = query.all()
        if len(questions) < questions_needed:
            questions = Question.query.filter_by(status='approved').all()
    if questions:
        questions.sort(key=lambda x: (x.total_serves, random.random()))
        return questions[:questions_needed]

    return []

def calculate_xp_for_run(correct_answers, total_score):
    return int((correct_answers * 10) + (total_score / 100))

def calculate_score_per_question(time_taken):
    time_taken = max(0.1, min(15, time_taken))
    time_bonus = max(0, (15 - time_taken)) * 10
    return 100 + time_bonus

# ==================== DYNAMIC BONUS SYSTEM ====================

def calculate_combo_bonus(user_id, round_id=None):
    """Calculate combo bonus based on consecutive correct answers in current session."""
    session_id = session.get('round_session_id', '')
    if not session_id:
        session['combo_count'] = 0
        return 1.0

    recent_attempts = Attempt.query.filter_by(
        user_id=user_id,
        session_id=session_id
    ).order_by(Attempt.date_attempted.desc()).limit(10).all()

    combo = 0
    for attempt in recent_attempts:
        if attempt.is_correct:
            combo += 1
        else:
            break

    session['combo_count'] = combo

    if combo >= 10:
        return 2.0
    if combo >= 7:
        return 1.75
    if combo >= 5:
        return 1.5
    if combo >= 3:
        return 1.25
    return 1.0

def calculate_speed_bonus(time_taken, question_difficulty='medium'):
    """Calculate speed bonus based on answer time."""
    thresholds = {
        'easy': 8,
        'easy-medium': 10,
        'medium': 12,
        'medium-hard': 14,
        'hard': 15,
        'very-hard': 16,
        'expert': 18
    }
    threshold = thresholds.get(question_difficulty, 12)

    if time_taken <= threshold * 0.3:
        return 1.5
    if time_taken <= threshold * 0.5:
        return 1.3
    if time_taken <= threshold * 0.7:
        return 1.2
    if time_taken <= threshold * 0.9:
        return 1.1
    return 1.0

def calculate_accuracy_bonus(user_id, topic_id=None):
    """Calculate accuracy bonus based on historical performance."""
    if topic_id:
        try:
            accuracies = json.loads(current_user.category_accuracies or '{}')
            cat_stats = accuracies.get(str(topic_id), {'total': 0, 'correct': 0})
            if cat_stats['total'] >= 10:
                accuracy = (cat_stats['correct'] / cat_stats['total']) * 100
                if accuracy >= 90:
                    return 1.3
                if accuracy >= 80:
                    return 1.2
                if accuracy >= 70:
                    return 1.1
        except Exception:
            pass
    return 1.0

def calculate_season_bonus():
    """Calculate seasonal bonus (changes quarterly)."""
    now = datetime.datetime.utcnow()
    season_number = ((now.month - 1) // 3) + 1
    season_year = now.year
    session['season_number'] = season_number
    session['season_year'] = season_year

    season_bonuses = {
        1: 1.1,   # Winter
        2: 1.15,  # Spring
        3: 1.2,   # Summer
        4: 1.05   # Fall
    }
    return season_bonuses.get(season_number, 1.0)

def calculate_total_bonus_multiplier(user, streak_bonus, combo_bonus, speed_bonus, accuracy_bonus, season_bonus, powerup_bonus=1.0):
    """Calculate total bonus multiplier combining all factors."""
    total = streak_bonus * combo_bonus * speed_bonus * accuracy_bonus * season_bonus * powerup_bonus
    return min(total, 5.0)

def get_powerup_bonus_multiplier(powerups_used_raw):
    """Derive power-up multiplier from submitted power-up state JSON."""
    if not powerups_used_raw:
        return 1.0

    try:
        state = json.loads(powerups_used_raw)
    except (TypeError, ValueError):
        return 1.0

    if not isinstance(state, dict):
        return 1.0

    if state.get('double_points'):
        return 2.0
    if state.get('time_freeze'):
        return 1.15
    if state.get('fifty_fifty'):
        return 1.2
    if state.get('shield'):
        return 1.1
    return 1.0

# ==================== WORD CHALLENGE HELPER FUNCTIONS ====================

def validate_word(word):
    """Check if a word is valid in the dictionary"""
    return word.upper() in DICTIONARY

def is_first_move(board):
    """Check if this is the first move of the challenge"""
    for i in range(15):
        for j in range(15):
            if board[i][j]['letter'] is not None:
                return False
    return True

def check_word_validity(word, rack_letters, board, start_pos, direction):
    """Comprehensive word validity check"""
    word = word.upper()
    row, col = start_pos
    positions = []
    
    # Check if word fits on board
    if direction == 'horizontal':
        if col + len(word) > 15:
            return False, None, "Word extends beyond right edge of board"
    else:  # vertical
        if row + len(word) > 15:
            return False, None, "Word extends beyond bottom edge of board"
    
    # Check if first move
    first_move = is_first_move(board)
    temp_rack = rack_letters.copy()
    center_covered = False
    connected = False
    
    for i, letter in enumerate(word):
        r = row + (i if direction == 'vertical' else 0)
        c = col + (i if direction == 'horizontal' else 0)
        
        # Check bounds
        if r >= 15 or c >= 15:
            return False, None, "Word extends beyond board"
        
        existing = board[r][c]['letter']
        
        if existing:
            # Position already has a letter
            if existing != letter:
                return False, None, f"Position ({r},{c}) has '{existing}', cannot place '{letter}'"
            # Using existing letter on board - don't remove from rack
            connected = True
        else:
            # New placement - need to have this letter in rack
            if letter in temp_rack:
                temp_rack.remove(letter)
            else:
                return False, None, f"You don't have the letter '{letter}' to place at ({r},{c})"
            
            # Check adjacent cells for connection (except for first move)
            if not first_move:
                adjacent_positions = [
                    (r-1, c), (r+1, c), (r, c-1), (r, c+1)
                ]
                for ar, ac in adjacent_positions:
                    if 0 <= ar < 15 and 0 <= ac < 15:
                        if board[ar][ac]['letter'] is not None:
                            connected = True
        
        positions.append((r, c))
        
        # Check if covering center for first move
        if r == 7 and c == 7:
            center_covered = True
    
    # First move must cover center
    if first_move and not center_covered:
        return False, None, "First move must cover the center square (7,7)"
    
    # Not first move must connect to existing letters
    if not first_move and not connected:
        return False, None, "Word must connect to existing letters on the board"
    
    # Check if we're actually using any new tiles
    if len(temp_rack) == len(rack_letters):
        return False, None, "Word must use at least one new tile"
    
    return True, positions, None

def calculate_move_score(word, positions, board):
    """Calculate score for a word placement"""
    word = word.upper()
    total_score = 0
    word_multiplier = 1
    new_tiles_used = 0
    
    for i, (row, col) in enumerate(positions):
        letter = word[i]
        letter_value = LETTER_VALUES.get(letter, 0)
        
        # Check if position already has a letter
        if board[row][col]['letter'] is not None:
            total_score += letter_value
            continue
        
        # New tile placement
        new_tiles_used += 1
        
        # Apply bonus for this position
        bonus = board[row][col]['bonus']
        if bonus == 'DLS':  # Double Letter Score
            total_score += letter_value * 2
        elif bonus == 'TLS':  # Triple Letter Score
            total_score += letter_value * 3
        elif bonus == 'DWS':  # Double Word Score
            total_score += letter_value
            word_multiplier *= 2
        elif bonus == 'TWS':  # Triple Word Score
            total_score += letter_value
            word_multiplier *= 3
        else:
            total_score += letter_value
    
    total_score *= word_multiplier
    
    # Bingo bonus (using all 7 tiles in one play)
    if new_tiles_used == 7:
        total_score += 50
    
    return total_score, new_tiles_used

def check_cross_words(word, positions, board):
    """Check if all cross-words formed are valid"""
    word = word.upper()
    
    for i, (row, col) in enumerate(positions):
        # Only check positions where we're placing a new tile
        if board[row][col]['letter'] is not None:
            continue
            
        letter = word[i]
        
        # Check horizontal cross-word
        if board[row][col]['bonus'] != 'TWS' and board[row][col]['bonus'] != 'DWS':
            # Find start of horizontal word
            start_col = col
            while start_col > 0 and board[row][start_col - 1]['letter'] is not None:
                start_col -= 1
            
            # Find end of horizontal word
            end_col = col
            while end_col < 14 and board[row][end_col + 1]['letter'] is not None:
                end_col += 1
            
            if start_col != col or end_col != col:
                # There's a cross-word
                cross_word = ''
                for c in range(start_col, end_col + 1):
                    if c == col:
                        cross_word += letter
                    else:
                        cell_letter = board[row][c]['letter']
                        if cell_letter:
                            cross_word += cell_letter
                
                if len(cross_word) > 1 and not validate_word(cross_word):
                    return False, f"Invalid cross-word: {cross_word}"
        
        # Check vertical cross-word
        if board[row][col]['bonus'] != 'TWS' and board[row][col]['bonus'] != 'DWS':
            # Find start of vertical word
            start_row = row
            while start_row > 0 and board[start_row - 1][col]['letter'] is not None:
                start_row -= 1
            
            # Find end of vertical word
            end_row = row
            while end_row < 14 and board[end_row + 1][col]['letter'] is not None:
                end_row += 1
            
            if start_row != row or end_row != row:
                # There's a cross-word
                cross_word = ''
                for r in range(start_row, end_row + 1):
                    if r == row:
                        cross_word += letter
                    else:
                        cell_letter = board[r][col]['letter']
                        if cell_letter:
                            cross_word += cell_letter
                
                if len(cross_word) > 1 and not validate_word(cross_word):
                    return False, f"Invalid cross-word: {cross_word}"
    
    return True, None

def calculate_word_score(word, positions, board):
    """Calculate score for a word placement"""
    word = word.upper()
    total_score = 0
    word_multiplier = 1
    
    for i, letter in enumerate(word):
        row, col = positions[i]
        letter_value = LETTER_VALUES.get(letter, 0)
        
        # Check if position already has a letter
        if board[row][col]['letter'] is not None:
            # Using existing letter on board
            total_score += letter_value
            continue
        
        # Apply bonus for this position
        bonus = board[row][col]['bonus']
        if bonus == 'DLS':  # Double Letter Score
            total_score += letter_value * 2
        elif bonus == 'TLS':  # Triple Letter Score
            total_score += letter_value * 3
        elif bonus == 'DWS':  # Double Word Score
            total_score += letter_value
            word_multiplier *= 2
        elif bonus == 'TWS':  # Triple Word Score
            total_score += letter_value
            word_multiplier *= 3
        else:
            total_score += letter_value
    
    total_score *= word_multiplier
    
    # Bingo bonus (using all 7 tiles)
    if len(word) == 7:
        total_score += 50
    
    return total_score

def check_word_placement(word, start_pos, direction, board):
    """Check if a word can be placed at the given position"""
    word = word.upper()
    rows, cols = 15, 15
    row, col = start_pos
    positions = []
    
    # Check if word fits on board
    if direction == 'horizontal':
        if col + len(word) > cols:
            return False, None, "Word extends beyond board"
    else:  # vertical
        if row + len(word) > rows:
            return False, None, "Word extends beyond board"
    
    # Check if first move (board is empty)
    is_first_move = all(board[i][j]['letter'] is None 
                        for i in range(rows) for j in range(cols))
    
    if is_first_move:
        # First move must cover center (7,7)
        center_covered = False
        for i in range(len(word)):
            r = row + (i if direction == 'vertical' else 0)
            c = col + (i if direction == 'horizontal' else 0)
            if r == 7 and c == 7:
                center_covered = True
            positions.append((r, c))
        
        if not center_covered:
            return False, None, "First move must cover the center square (7,7)"
        
        return True, positions, None
    
    # Not first move - must connect to existing letters
    connected = False
    for i in range(len(word)):
        r = row + (i if direction == 'vertical' else 0)
        c = col + (i if direction == 'horizontal' else 0)
        
        # Check if position is already occupied
        if board[r][c]['letter'] is not None:
            if word[i] != board[r][c]['letter']:
                return False, None, f"Letter at ({r},{c}) is {board[r][c]['letter']}, not {word[i]}"
            connected = True
        else:
            # Check adjacent cells for connection
            adjacent_positions = [
                (r-1, c), (r+1, c), (r, c-1), (r, c+1)
            ]
            for ar, ac in adjacent_positions:
                if 0 <= ar < rows and 0 <= ac < cols:
                    if board[ar][ac]['letter'] is not None:
                        connected = True
        
        positions.append((r, c))
    
    if not connected:
        return False, None, "Word must connect to existing letters on the board"
    
    return True, positions, None

def get_ai_word_recommendation(user, rack, board):
    """Generate AI word recommendations based on current rack and board"""
    recommendations = []
    
    # Simple recommendation based on high-value letters
    rack_letters = [tile['letter'] for tile in rack]
    
    # Find possible words from dictionary
    possible_words = []
    for word in DICTIONARY:
        if len(word) <= 7 and all(rack_letters.count(c) >= word.count(c) for c in word):
            possible_words.append(word)
            if len(possible_words) > 20:  # Limit for performance
                break
    
    # Score each possible word
    scored_words = []
    for word in possible_words:
        # Try to find placement on board (simplified)
        # In production, implement full board search
        for i in range(15):
            for j in range(15):
                for direction in ['horizontal', 'vertical']:
                    valid, positions, error = check_word_placement(word, (i, j), direction, board)
                    if valid:
                        score = calculate_word_score(word, positions, board)
                        scored_words.append({
                            'word': word,
                            'score': score,
                            'positions': positions,
                            'direction': direction
                        })
                        break
            if scored_words:
                break
    
    # Sort by score
    scored_words.sort(key=lambda x: x['score'], reverse=True)
    
    # Generate recommendations
    for i, rec in enumerate(scored_words[:5]):
        character = get_character_for_context('challenge')
        message = None
        if character == 'GIGA':
            message = f"Try '{rec['word']}' for {rec['score']} points! You can do this! 💪"
        else:
            message = f"Recommended placement: '{rec['word']}' yields {rec['score']} points. Optimal efficiency."
        
        recommendations.append({
            'word': rec['word'],
            'score': rec['score'],
            'message': message,
            'character': character
        })
    
    return recommendations

def create_word_challenge_invite(inviter_id, invitee_id, challenge_type='friend'):
    """Create a challenge invite"""
    challenge = WordChallenge(
        challenge_type=challenge_type,
        status='waiting'
    )
    challenge.initialize_board()
    challenge.initialize_tile_bag()
    db.session.add(challenge)
    db.session.commit()
    
    # Add inviter as player 1
    player1 = WordChallengePlayer(
        challenge_id=challenge.id,
        user_id=inviter_id,
        player_number=1,
        is_ready=True
    )
    
    # Draw initial tiles for player 1
    initial_tiles = challenge.draw_tiles(7)
    player1.set_rack(initial_tiles)
    
    db.session.add(player1)
    
    # Create invite
    invite = WordChallengeInvite(
        challenge_id=challenge.id,
        inviter_id=inviter_id,
        invitee_id=invitee_id,
        expires_at=datetime.datetime.utcnow() + datetime.timedelta(hours=24)
    )
    
    db.session.add(invite)
    db.session.commit()
    
    return challenge, invite

def create_random_match(user_id):
    """Create or join a random match"""
    # Look for existing waiting challenges
    waiting_challenge = WordChallenge.query.filter_by(
        challenge_type='random',
        status='waiting'
    ).first()
    
    if waiting_challenge:
        # Join existing challenge
        existing_players = WordChallengePlayer.query.filter_by(challenge_id=waiting_challenge.id).count()
        if existing_players < 2:
            player2 = WordChallengePlayer(
                challenge_id=waiting_challenge.id,
                user_id=user_id,
                player_number=2,
                is_ready=True
            )
            
            # Draw initial tiles for player 2
            initial_tiles = waiting_challenge.draw_tiles(7)
            player2.set_rack(initial_tiles)
            
            db.session.add(player2)
            db.session.flush()
            
            # Start the challenge
            waiting_challenge.status = 'in_progress'
            waiting_challenge.started_at = datetime.datetime.utcnow()
            
            # Randomly choose who goes first
            waiting_challenge.current_turn = random.choice([1, 2])
            
            # Update turn flags
            players = WordChallengePlayer.query.filter_by(challenge_id=waiting_challenge.id).all()
            for existing_player in players:
                existing_player.is_turn = (existing_player.player_number == waiting_challenge.current_turn)
            
            db.session.commit()
            
            return waiting_challenge, False
    else:
        # Create new challenge
        challenge = WordChallenge(
            challenge_type='random',
            status='waiting'
        )
        challenge.initialize_board()
        challenge.initialize_tile_bag()
        db.session.add(challenge)
        db.session.commit()
        
        # Add player as player 1
        player1 = WordChallengePlayer(
            challenge_id=challenge.id,
            user_id=user_id,
            player_number=1,
            is_ready=True
        )
        
        # Draw initial tiles for player 1
        initial_tiles = challenge.draw_tiles(7)
        player1.set_rack(initial_tiles)
        
        db.session.add(player1)
        db.session.commit()
        
        return challenge, True
    
    return None, False

def create_practice_challenge(user_id):
    """Create a practice challenge against AI"""
    challenge = WordChallenge(
        challenge_type='practice',
        status='in_progress'
    )
    challenge.initialize_board()
    challenge.initialize_tile_bag()
    challenge.started_at = datetime.datetime.utcnow()
    challenge.current_turn = 1  # Player goes first
    db.session.add(challenge)
    db.session.commit()
    
    # Add player
    player = WordChallengePlayer(
        challenge_id=challenge.id,
        user_id=user_id,
        player_number=1,
        is_ready=True,
        is_turn=True
    )
    
    # Draw initial tiles for player
    initial_tiles = challenge.draw_tiles(7)
    player.set_rack(initial_tiles)
    
    db.session.add(player)
    
    # Create AI opponent
    ai_user = User.query.filter_by(email='ai@geekprotocol.com').first()
    if not ai_user:
        ai_user = User(
            username='ace_ai',
            email='ai@geekprotocol.com',
            role='ai',
            is_admin=False
        )
        ai_user.set_password('ai_password')
        db.session.add(ai_user)
        db.session.commit()
    
    ai_player = WordChallengePlayer(
        challenge_id=challenge.id,
        user_id=ai_user.id,
        player_number=2,
        is_ready=True,
        is_turn=False
    )
    
    # Draw initial tiles for AI
    ai_tiles = challenge.draw_tiles(7)
    ai_player.set_rack(ai_tiles)
    
    db.session.add(ai_player)
    db.session.commit()
    
    return challenge

def create_daily_challenge():
    """Create today's daily challenge"""
    today = datetime.date.today()
    challenge = WordChallengeDailyChallenge.query.filter_by(date=today).first()
    
    if not challenge:
        challenge = WordChallengeDailyChallenge(
            date=today,
            target_score=random.randint(150, 300),
            target_words=random.randint(5, 10),
            bonus_geek=random.uniform(5.0, 20.0),
            bonus_xp=random.randint(50, 150),
            description=f"Score {random.randint(150, 300)} points and play {random.randint(5, 10)} words today!"
        )
        db.session.add(challenge)
        db.session.commit()
    
    return challenge

# ==================== AI ENHANCED CHARACTER FUNCTIONS ====================

def get_knowledge_for_topic(topic_name):
    """Retrieve comprehensive knowledge base info for a topic"""
    topic_key = None
    
    topic_mapping = {
    "Sci-Fi Cinema & TV": "sci_fi_cinema_tv",
    "Fantasy Literature & Challenges": "fantasy_literature_challenges",
    "Video Entertainment": "video_challenges",
    "Anime & Manga": "anime_manga",
    "Comics & Superheroes": "comics_superheroes",
    "Technology & Computing": "technology_computing",
    "Science & Futurism": "science_futurism",
    "Tabletop & Board Activities": "tabletop_board_challenges",
    "Kaspa Basics": "kaspa_basics",
    "Kaspa Technology": "kaspa_technology",
    "Kaspa History": "kaspa_history",
    "Kaspa Tokenomics": "kaspa_tokenomics",
    "Kaspa Mining": "kaspa_mining",
    "Kaspa Wallets": "kaspa_wallets",
    "Kaspa Exchange": "kaspa_exchange",
    "Kaspa Ecosystem": "kaspa_ecosystem",
    "Kaspa Community": "kaspa_community",
    "Kaspa Team": "kaspa_team",
}
    
    topic_key = topic_mapping.get(topic_name)
    if topic_key and topic_key in AI_KNOWLEDGE.get('knowledge_domains', {}):
        return AI_KNOWLEDGE['knowledge_domains'][topic_key]
    return None

def generate_ai_recommendation(user):
    """Generate personalized AI recommendation based on user performance"""
    recommendation = {
        'type': 'general',
        'message': '',
        'priority': 'medium'
    }
    
    # Check word challenge stats
    if user.word_challenge_wins == 0 and user.word_challenge_total_score > 0:
        recommendation['type'] = 'word_challenge'
        recommendation['message'] = "You're getting close to your first word challenge win! Keep practicing! 🏆"
        recommendation['priority'] = 'high'
        return recommendation
    
    if user.word_challenge_bingos == 0 and user.word_challenge_total_score > 500:
        recommendation['type'] = 'word_challenge'
        recommendation['message'] = "You haven't scored a bingo yet! Try to use all 7 tiles in one play for a 50-point bonus! 🎯"
        recommendation['priority'] = 'high'
        return recommendation
    
    # Check weak topics
    weak_topics = user.get_weak_topics(threshold=60)
    if weak_topics:
        cat = weak_topics[0]
        topic = Topic.query.get(cat['topic_id'])
        if topic:
            recommendation['type'] = 'weak_topic'
            recommendation['message'] = f"I notice your accuracy in {topic.name} is {cat['accuracy']}%. Would you like some practice questions in this area? 📚"
            recommendation['priority'] = 'high'
            recommendation['topic_id'] = cat['topic_id']
            return recommendation
    
    # Check streak status
    if user.current_streak > 0 and user.current_streak % 7 == 0:
        days_until_milestone = (7 - (user.current_streak % 7)) if user.current_streak % 7 != 0 else 7
        recommendation['type'] = 'streak'
        recommendation['message'] = f"You're just {days_until_milestone} days away from your next streak milestone! Keep that 🔥 alive!"
        recommendation['priority'] = 'medium'
        return recommendation
    
    # Check Gauntlet readiness
    if user.level >= 5 and user.level < 20:
        recommendation['type'] = 'gauntlet'
        recommendation['message'] = "Ready to test your skills? The Geek Gauntlet awaits! Round 1 is free and you can win GEEK tokens! ⚔️"
        recommendation['priority'] = 'medium'
        return recommendation
    
    # Check daily challenge
    today = datetime.date.today()
    challenge = WordChallengeDailyChallenge.query.filter_by(date=today).first()
    if challenge:
        progress = WordChallengeUserProgress.query.filter_by(
            user_id=user.id,
            challenge_id=challenge.id
        ).first()
        
        if not progress or not progress.completed:
            recommendation['type'] = 'daily_challenge'
            recommendation['message'] = f"Today's challenge: {challenge.description} Earn {challenge.bonus_geek} GEEK and {challenge.bonus_xp} XP! 📅"
            recommendation['priority'] = 'medium'
            return recommendation
    
    # Default recommendation
    recommendation['message'] = "Keep up the great work! Every word you learn and question you answer makes you stronger! 💪"
    return recommendation

def get_question_context_analysis(question, user):
    """Provide AI analysis of a question before user answers"""
    topic = question.topic
    topic_info = get_knowledge_for_topic(topic.name) if topic else None
    
    analysis = {
        'difficulty_assessment': question.difficulty,
        'estimated_time': '15 seconds',
        'fun_fact': None,
        'topic_insight': None,
        'tip': None
    }
    
    if question.fun_fact:
        analysis['fun_fact'] = question.fun_fact
    
    if topic_info:
        emoji = topic_info.get('emoji', '📚')
        core_topics = topic_info.get('core_topics', [])
        if core_topics:
            random_topic = random.choice(core_topics)
            analysis['topic_insight'] = f"{emoji} {topic.name} explores {random_topic}!"
    
    weak_topics = user.get_weak_topics(threshold=60)
    for weak in weak_topics:
        if weak['topic_id'] == topic.id:
            analysis['tip'] = f"This topic is a growth opportunity! Your accuracy here is {weak['accuracy']}%. Focus and you'll improve quickly! 🎯"
            break
    
    return analysis

def get_giga_message(user, context=None):
    """Enhanced GIGA message with AI knowledge base integration"""
    giga_data = AI_KNOWLEDGE.get('characters', {}).get('GIGA', {})
    catchphrases = giga_data.get('catchphrases', [])
    affinity_messages = giga_data.get('affinity_messages', {})
    
    affinity = user.character_affinity_giga
    affinity_level = 'low'
    if affinity >= 80:
        affinity_level = 'max'
    elif affinity >= 60:
        affinity_level = 'high'
    elif affinity >= 40:
        affinity_level = 'medium'
    
    messages = []
    
    if context == 'word_challenge_start':
        messages = [
            "Time to build some words! Your vocabulary is about to get a workout! 📚",
            "Every word you play is a step toward mastery! Let's do this! 💪",
            "I believe in you! Show those letters who's boss! ✨",
            "Words are friends! Let's make some new ones together! 🌟"
        ]
        if catchphrases:
            messages.append(random.choice(catchphrases))
            
        if affinity_level in affinity_messages:
            messages.append(random.choice(affinity_messages[affinity_level]))
            
    elif context == 'word_challenge_win':
        messages = [
            "VICTORY! You crushed it! Your words were unstoppable! 🏆",
            "Congratulations on your win! Your vocabulary is expanding beautifully! 🌈",
            "You did it! All that practice paid off! 🎉",
            "Another win! You're becoming a true wordsmith! 📖"
        ]
        
    elif context == 'word_challenge_loss':
        messages = [
            "Great challenge! Every match teaches us something new! 🌱",
            "Don't worry about the loss - you played some great words! 🎯",
            "The best players learn from every challenge! You're getting stronger! 💫",
            "You're improving with every word you play! Keep going! 🔥"
        ]
        
    elif context == 'bingo_scored':
        messages = [
            "BINGO! You used all 7 tiles! That's incredible! 🎯",
            "A perfect play! 50 bonus points! You're amazing! ⭐",
            "All 7 tiles?! That's championship material! 🏆",
            "BINGO! I knew you had it in you! 🎉"
        ]
        
    elif context == 'high_score':
        messages = [
            f"A new personal best! {user.word_challenge_high_score} points! 🚀",
            "You just broke your own record! Outstanding! 📈",
            "Your best challenge ever! The community celebrates with you! 🎊",
            "Record broken! You're reaching new heights! ⛰️"
        ]
    
    elif context == 'login':
        if user.current_streak == 1:
            messages = [
                "Welcome back! Your knowledge journey continues! 🌟",
                "Great to see you! Ready for some intellectual adventure? 🚀",
                "Hello again! The community is brighter with you here! ☀️"
            ]
            if catchphrases:
                messages.append(random.choice(catchphrases))
        elif user.current_streak >= 7:
            messages = [
                f"🔥 {user.current_streak}-Day Streak Champion! You're on fire!",
                f"Consistency is key! Day {user.current_streak} and going strong! 💪",
                f"Impressive dedication! {user.current_streak} days of learning! 🎯"
            ]
        else:
            messages = [
                "Welcome back! Your curiosity inspires us all! 💫",
                "Hello! New challenges await your brilliant mind! 🧠",
                "Great to have you back! The learning never stops! 📚"
            ]
            
        if affinity_level in affinity_messages:
            messages.append(random.choice(affinity_messages[affinity_level]))
            
    elif context == 'correct_answer':
        if affinity_level == 'max':
            messages = affinity_messages.get('max', [])
        elif affinity_level == 'high':
            messages = affinity_messages.get('high', [])
        elif affinity_level == 'medium':
            messages = affinity_messages.get('medium', [])
        else:
            messages = [
                "Great job! Every correct answer builds your expertise! 🏗️",
                "Correct! You're on the right path! 🛤️",
                "Nice work! Learning is a journey, and you're making progress! 🚶‍♂️"
            ]
            
    elif context == 'incorrect_answer':
        if affinity_level == 'max':
            messages = [
                "That was a tough one! Even experts learn something new every day! 📖",
                "A valuable learning moment! Every misstep brings you closer to mastery! 🧭",
                "Don't worry! The most important answers are the ones that teach us something! 🎓"
            ]
        elif affinity_level == 'high':
            messages = [
                "Great attempt! Sometimes the journey teaches more than the destination! 🗺️",
                "Learning happens with every question! You're building valuable knowledge! 🧱",
                "That's okay! Every challenge makes you stronger! 💪"
            ]
        else:
            messages = [
                "No problem! Every expert was once a beginner! 🌱",
                "Keep going! Persistence is the key to mastery! 🔑",
                "You're learning! That's what matters most! 🎯"
            ]
            
    elif context == 'level_up':
        messages = [
            f"🎉 LEVEL UP! You're now Level {user.level}! The community celebrates your growth!",
            f"Congratulations! Level {user.level} achieved! Your knowledge journey reaches new heights! 🏔️",
            f"Incredible progress! Level {user.level} unlocked! You're becoming a true knowledge champion! 🏅"
        ]
        
    elif context == 'achievement':
        messages = [
            "🏆 Achievement unlocked! Your dedication is inspiring the whole community!",
            "Another milestone reached! You're setting a fantastic example! 🌟",
            "Amazing work! Your achievements light the way for others! 💡"
        ]
        
    elif context == 'first_login':
        messages = [
            "Welcome to Geek Protocol! We're thrilled to have you join our community of curious minds! 🎊",
            "Hello, new friend! Your knowledge journey begins here! Adventure awaits! 🗺️",
            "Welcome aboard! Together, we'll explore the fascinating world of knowledge! 🌍"
        ]
        
    elif context == 'streak_milestone':
        messages = [
            "🔥 Streak milestone achieved! Your consistency is remarkable!",
            "Impressive dedication! Your daily learning habit is inspiring! 📅",
            "Consistency champion! Your streak shows true commitment to growth! 🏆"
        ]
        
    elif context == 'gauntlet_complete':
        messages = [
            "Gauntlet conquered! Your intellectual courage is extraordinary! ⚔️",
            "Challenge mastered! You've proven your knowledge under pressure! 🛡️",
            "Victory achieved! The community applauds your expertise! 👏"
        ]
    
    elif context == 'dashboard':
        rec = generate_ai_recommendation(user)
        messages = [rec['message']]
        
    elif context == 'quiz_start':
        messages = [
            "Remember: Every question answered makes you wiser! 🧠",
            "The community is here cheering for you! You're not alone in this journey! 👥",
            "Your curiosity is your superpower! Keep asking, keep learning! 💫",
            "Knowledge grows when shared! You're contributing to something amazing! 🌱"
        ]
    elif context == 'gauntlet_hint':
        messages = [
            "Trust your intuition first, then verify with logic. The right answer has cleaner reasoning. ✨",
            "Slow your breathing. Eliminate the noisiest option and the pattern will reveal itself. 💫",
            "You are close. Focus on the core concept, not the flashy distractor. 🌟"
        ]
    elif context in ('combo_milestone_3', 'combo_milestone_5', 'combo_milestone_7', 'combo_milestone_10'):
        combo_target = context.split('_')[-1]
        messages = [
            f"{combo_target}x combo! You're in flow state now. Keep the rhythm. 🔥",
            f"Combo {combo_target} unlocked! Momentum is on your side. ⚡",
            f"{combo_target} in a row! Precision and confidence are syncing perfectly. 🎯"
        ]
    elif context == 'near_miss':
        messages = [
            "That was so close. Your read was almost perfect. Reset and strike the next one. 💪",
            "Near-miss. The combo snapped, but your pace is still elite. Rebuild immediately. 🔄",
            "You were one decision away from keeping the chain alive. Stay aggressive. 🚀"
        ]
    elif context == 'sudden_death_warning':
        messages = [
            "Sudden death active. Every click matters now. Calm mind, clean choice. ⚠️",
            "Pressure spike. One miss ends this stretch, so trust your strongest logic. 🔥",
            "This is the edge. Breathe, lock in, and execute. 🛡️"
        ]
    
    else:
        messages = [
            "Remember: Every word and every question makes you stronger! 🧠",
            "The community is here cheering for you! You're not alone in this journey! 👥",
            "Your curiosity is your superpower! Keep learning, keep playing! 💫",
            "Knowledge grows when shared! You're contributing to something amazing! 🌱"
        ]
    
    return random.choice(messages) if messages else "Keep learning and growing! 🌟"

def get_ace_message(user, context=None):
    """Enhanced A.C.E. message with AI knowledge base integration"""
    ace_data = AI_KNOWLEDGE.get('characters', {}).get('ACE', {})
    catchphrases = ace_data.get('catchphrases', [])
    affinity_messages = ace_data.get('affinity_messages', {})
    
    affinity = user.character_affinity_ace
    affinity_level = 'low'
    if affinity >= 80:
        affinity_level = 'max'
    elif affinity >= 60:
        affinity_level = 'high'
    elif affinity >= 40:
        affinity_level = 'medium'
    
    messages = []
    
    if context == 'word_challenge_start':
        if affinity_level == 'max':
            messages = affinity_messages.get('max', [])
        elif affinity_level == 'high':
            messages = affinity_messages.get('high', [])
        else:
            messages = [
                "Word construction protocol engaged. Analyze letter values.",
                "Scrabble probability matrix loaded. Optimal placement recommended.",
                "Vocabulary database accessed. Proceed with word formation."
            ]
            
    elif context == 'word_placed':
        if affinity_level == 'max':
            messages = [
                "Word placement analysis: Optimal. Score efficiency: Maximum.",
                "Letter value utilization: Exceptional. Continue this pattern.",
                "Lexical placement: Perfect. Spatial optimization achieved."
            ]
        elif affinity_level == 'high':
            messages = [
                "Word validated. Score calculation: Above average.",
                "Letter arrangement: Efficient. Slight improvements possible.",
                "Placement strategy: Good. Consider premium squares."
            ]
        else:
            messages = [
                "Word accepted. Score: Acceptable.",
                "Valid word detected. Efficiency rating: Satisfactory.",
                "Letter placement verified. Continue practice."
            ]
            
    elif context == 'optimal_placement':
        messages = [
            "Optimal placement detected. Maximum point efficiency achieved.",
            "Premium square utilization: Perfect. Score multiplier applied.",
            "Ideal word positioning confirmed. This is master-level play."
        ]
        
    elif context == 'high_value_word':
        messages = [
            f"High-value word detected. {affinity} points is exceptional.",
            "Lexical efficiency: Superior. This word demonstrates mastery.",
            "Advanced vocabulary confirmed. Your linguistic capabilities are impressive."
        ]
        
    elif context == 'quiz_start':
        if affinity_level == 'max':
            messages = affinity_messages.get('max', [])
        elif affinity_level == 'high':
            messages = affinity_messages.get('high', [])
        else:
            messages = [
                "Challenge initialized. Prepare for intellectual assessment.",
                "Knowledge evaluation sequence beginning. Demonstrate your understanding.",
                "Cognitive assessment protocol engaged. Answer with precision."
            ]
        
    elif context == 'correct_answer':
        if affinity_level == 'max':
            messages = affinity_messages.get('max', [])
        elif affinity_level == 'high':
            messages = affinity_messages.get('high', [])
        elif affinity_level == 'medium':
            messages = affinity_messages.get('medium', [])
        else:
            messages = [
                "Correct. Your response demonstrates solid knowledge acquisition.",
                "Accurate. Evidence of effective learning patterns detected.",
                "Valid. Your understanding meets established criteria."
            ]
            
    elif context == 'incorrect_answer':
        if affinity_level == 'max':
            messages = affinity_messages.get('max', [])
        elif affinity_level == 'high':
            messages = affinity_messages.get('high', [])
        elif affinity_level == 'medium':
            messages = affinity_messages.get('medium', [])
        else:
            messages = [
                "Incorrect. Analysis suggests reviewing advanced concepts in this domain.",
                "Answer invalid. Recommend deeper study of related principles.",
                "Inaccurate. This indicates an opportunity for specialized learning."
            ]
            
    elif context == 'fast_answer':
        messages = [
            "Response time: Exceptional. Cognitive processing speed: Optimal.",
            "Temporal efficiency noted. Intellectual reflexes: Advanced.",
            "Rapid response detected. Mental agility: Superior."
        ]
        
    elif context == 'perfect_round':
        messages = [
            "Performance analysis: Flawless execution. Maximum efficiency achieved.",
            "Assessment complete: 100% accuracy. Intellectual precision: Masterful.",
            "Result compilation: Perfect score. Knowledge application: Optimal."
        ]
        
    elif context == 'difficult_question_correct':
        messages = [
            "Complex question correctly answered. Advanced cognitive abilities confirmed.",
            "Difficult challenge successfully navigated. Intellectual capacity: Superior.",
            "Sophisticated problem correctly solved. Analytical skills: Exceptional."
        ]
        
    elif context == 'gauntlet_round_complete':
        messages = [
            "Round completion verified. Performance metrics analyzed and logged.",
            "Assessment stage cleared. Efficiency rating calculated.",
            "Challenge segment concluded. Intellectual progress quantified."
        ]
    elif context == 'gauntlet_hint':
        messages = [
            "Hint protocol: discard the option with the weakest definitional alignment.",
            "Elimination strategy: identify contradiction first, then compare the two strongest candidates.",
            "Analytical shortcut: prioritize the answer most consistent with fundamental principles."
        ]
    elif context in ('combo_milestone_3', 'combo_milestone_5', 'combo_milestone_7', 'combo_milestone_10'):
        combo_target = context.split('_')[-1]
        messages = [
            f"Combo milestone {combo_target} achieved. Consistency coefficient increasing.",
            f"{combo_target}-chain confirmed. Maintain current response discipline.",
            f"Streak {combo_target} validated. Error margin currently minimal."
        ]
    elif context == 'near_miss':
        messages = [
            "Near-miss registered. Error delta was minimal. Immediate recovery recommended.",
            "Combo interruption detected. Performance trend remains strong despite deviation.",
            "Result: almost correct. Apply tighter elimination on the next item."
        ]
    elif context == 'sudden_death_warning':
        messages = [
            "Sudden death condition active. One incorrect response will terminate this phase.",
            "Risk threshold elevated. Prioritize certainty over speed for this state.",
            "Critical mode enabled. Execute only high-confidence selections."
        ]
        
    elif context == 'mastery_demonstrated':
        messages = [
            "Mastery level detected. Your knowledge exceeds standard benchmarks.",
            "Expert proficiency confirmed. Cognitive capabilities: Advanced tier.",
            "Superior understanding demonstrated. Intellectual classification: Elite."
        ]
        
    elif context == 'review_submission':
        messages = [
            "Review analysis complete. Your assessment contributes to knowledge validation.",
            "Feedback processed. Quality control metrics updated.",
            "Validation recorded. Your judgment strengthens community standards."
        ]
    
    else:
        messages = [
            "Prepare for the next intellectual challenge.",
            "Knowledge assessment continuing. Maintain focus.",
            "Next question initialized. Demonstrate your understanding.",
            "Cognitive evaluation proceeding. Accuracy expected."
        ]
    
    if affinity >= 50 and catchphrases and random.random() < 0.3:
        return random.choice(catchphrases)
    
    return random.choice(messages) if messages else "Proceed with knowledge assessment."

def log_character_interaction(user_id, character, interaction_type, message, context=None):
    """Log character interaction in database"""
    interaction = CharacterInteraction(
        user_id=user_id,
        character=character,
        interaction_type=interaction_type,
        message=message,
        context=context
    )
    db.session.add(interaction)
    
    ai_message = AIMessageHistory(
        user_id=user_id,
        character=character,
        message=message,
        context=context
    )
    db.session.add(ai_message)
    
    db.session.commit()

def get_character_for_context(context):
    """Determine which character should appear in a given context"""
    giga_contexts = ['login', 'level_up', 'achievement', 'first_login', 
                     'streak_milestone', 'community', 'encouragement', 'dashboard',
                     'word_challenge_win', 'word_challenge_loss', 'bingo_scored', 'high_score']
    
    ace_contexts = ['quiz_start', 'fast_answer', 'perfect_round', 'word_challenge_start',
                    'difficult_question', 'mastery', 'assessment', 'review_submission',
                    'word_placed', 'optimal_placement', 'high_value_word']
    
    if context in giga_contexts:
        return 'GIGA'
    elif context in ace_contexts:
        return 'ACE'
    else:
        hour = datetime.datetime.now().hour
        if 6 <= hour < 18:
            return random.choices(['GIGA', 'ACE'], weights=[40, 60])[0]
        else:
            return random.choices(['GIGA', 'ACE'], weights=[60, 40])[0]

# ==================== WORD CHALLENGE ROUTES ====================

@app.route('/word_challenges')
@login_required
def word_challenges():
    """Word challenges hub page"""
    active_challenges = WordChallenge.query.join(WordChallengePlayer).filter(
        WordChallengePlayer.user_id == current_user.id,
        WordChallenge.status.in_(['waiting', 'in_progress'])
    ).all()
    
    completed_challenges = WordChallenge.query.join(WordChallengePlayer).filter(
        WordChallengePlayer.user_id == current_user.id,
        WordChallenge.status == 'completed'
    ).order_by(WordChallenge.completed_at.desc()).limit(10).all()
    
    pending_invites = WordChallengeInvite.query.filter_by(
        invitee_id=current_user.id,
        status='pending'
    ).filter(WordChallengeInvite.expires_at > datetime.datetime.utcnow()).all()
    
    today = datetime.date.today()
    daily_challenge = WordChallengeDailyChallenge.query.filter_by(date=today).first()
    if not daily_challenge:
        daily_challenge = create_daily_challenge()
    
    challenge_progress = WordChallengeUserProgress.query.filter_by(
        user_id=current_user.id,
        challenge_id=daily_challenge.id
    ).first()
    
    leaderboard = db.session.query(
        User,
        User.word_challenge_wins,
        User.word_challenge_total_score,
        User.word_challenge_high_score,
        User.word_challenge_bingos
    ).filter(User.word_challenge_wins > 0).order_by(
        User.word_challenge_wins.desc(),
        User.word_challenge_total_score.desc()
    ).limit(20).all()
    
    character = get_character_for_context('word_challenge_start')
    character_message = None
    if character == 'GIGA':
        character_message = get_giga_message(current_user, 'word_challenge_start')
        current_user.add_character_interaction('GIGA', 'word_challenge_hub_view')
    else:
        character_message = get_ace_message(current_user, 'word_challenge_start')
        current_user.add_character_interaction('ACE', 'word_challenge_hub_view')
    
    return render_template('word_challenges/hub.html',
                         active_challenges=active_challenges,
                         completed_challenges=completed_challenges,
                         pending_invites=pending_invites,
                         daily_challenge=daily_challenge,
                         challenge_progress=challenge_progress,
                         leaderboard=leaderboard,
                         character=character,
                         character_message=character_message)

@app.route('/word_challenges/invite', methods=['GET', 'POST'])
@login_required
def word_challenge_invite():
    """Send a challenge invite to a friend by username"""
    if request.method == 'POST':
        friend_username = request.form.get('friend_username', '').strip()
        friend = User.query.filter_by(username=friend_username).first()
        
        if not friend:
            flash(f'User "{friend_username}" not found!', 'danger')
            return redirect(url_for('word_challenge_invite'))
        
        if friend.id == current_user.id:
            flash('You cannot invite yourself!', 'danger')
            return redirect(url_for('word_challenge_invite'))
        
        challenge, invite = create_word_challenge_invite(current_user.id, friend.id)
        
        flash(f'Invitation sent to {friend_username}!', 'success')
        
        # Character interaction
        message = get_giga_message(current_user, 'encouragement')
        current_user.add_character_interaction('GIGA', 'challenge_invite_sent', {
            'friend_id': friend.id,
            'friend_username': friend.username,
            'challenge_id': challenge.id
        })
        log_character_interaction(current_user.id, 'GIGA', 'challenge_invite', message, 'invite')
        
        return redirect(url_for('word_challenge_waiting', challenge_id=challenge.id))
    
    return render_template('word_challenges/invite.html')

@app.route('/word_challenges/random')
@login_required
def word_challenge_random():
    """Find a random match"""
    challenge, is_creator = create_random_match(current_user.id)
    
    if not challenge:
        flash('Unable to create or join a challenge. Please try again.', 'danger')
        return redirect(url_for('word_challenges'))
    
    if is_creator:
        flash('Waiting for an opponent to join...', 'info')
        return redirect(url_for('word_challenge_waiting', challenge_id=challenge.id))
    else:
        flash('Match found! Starting challenge...', 'success')
        return redirect(url_for('word_challenge_play', challenge_id=challenge.id))

@app.route('/word_challenges/practice')
@login_required
def word_challenge_practice():
    """Start a practice challenge against AI"""
    challenge = create_practice_challenge(current_user.id)
    flash('Practice challenge started! Play against A.C.E.', 'success')
    
    # Character interaction
    message = get_ace_message(current_user, 'word_challenge_start')
    current_user.add_character_interaction('ACE', 'practice_challenge_started', {
        'challenge_id': challenge.id
    })
    log_character_interaction(current_user.id, 'ACE', 'practice_challenge', message, 'practice')
    
    return redirect(url_for('word_challenge_play', challenge_id=challenge.id))

@app.route('/word_challenges/accept_invite/<int:invite_id>')
@login_required
def word_challenge_accept_invite(invite_id):
    """Accept a challenge invitation"""
    invite = WordChallengeInvite.query.get_or_404(invite_id)
    
    if invite.invitee_id != current_user.id:
        flash('This invitation was not for you!', 'danger')
        return redirect(url_for('word_challenges'))
    
    if invite.status != 'pending':
        flash('This invitation is no longer valid!', 'warning')
        return redirect(url_for('word_challenges'))
    
    if invite.expires_at < datetime.datetime.utcnow():
        invite.status = 'expired'
        db.session.commit()
        flash('This invitation has expired!', 'warning')
        return redirect(url_for('word_challenges'))
    
    challenge = invite.challenge
    
    # Check if challenge is still waiting
    if challenge.status != 'waiting':
        flash('This challenge is no longer available!', 'warning')
        return redirect(url_for('word_challenges'))
    
    # Add player as player 2
    player2 = WordChallengePlayer(
        challenge_id=challenge.id,
        user_id=current_user.id,
        player_number=2,
        is_ready=True
    )
    
    # Draw initial tiles for player 2
    initial_tiles = challenge.draw_tiles(7)
    player2.set_rack(initial_tiles)
    
    db.session.add(player2)
    db.session.flush()
    
    # Start the challenge
    challenge.status = 'in_progress'
    challenge.started_at = datetime.datetime.utcnow()
    challenge.current_turn = random.choice([1, 2])
    
    # Update turn flags
    players = WordChallengePlayer.query.filter_by(challenge_id=challenge.id).all()
    for existing_player in players:
        existing_player.is_turn = (existing_player.player_number == challenge.current_turn)
    
    # Update invite status
    invite.status = 'accepted'
    
    db.session.commit()
    
    flash('Challenge started! Good luck!', 'success')
    return redirect(url_for('word_challenge_play', challenge_id=challenge.id))

@app.route('/word_challenges/decline_invite/<int:invite_id>')
@login_required
def word_challenge_decline_invite(invite_id):
    """Decline a challenge invitation"""
    invite = WordChallengeInvite.query.get_or_404(invite_id)
    
    if invite.invitee_id != current_user.id:
        flash('This invitation was not for you!', 'danger')
        return redirect(url_for('word_challenges'))
    
    invite.status = 'declined'
    db.session.commit()
    
    flash('Invitation declined.', 'info')
    return redirect(url_for('word_challenges'))

@app.route('/word_challenges/waiting/<int:challenge_id>')
@login_required
def word_challenge_waiting(challenge_id):
    """Waiting room for challenge to start"""
    challenge = WordChallenge.query.get_or_404(challenge_id)
    
    # Check if user is part of this challenge
    is_player = any(p.user_id == current_user.id for p in challenge.players)
    if not is_player:
        flash('You are not part of this challenge!', 'danger')
        return redirect(url_for('word_challenges'))
    
    return render_template('word_challenges/waiting.html', challenge=challenge)

@app.route('/word_challenges/play/<int:challenge_id>')
@login_required
def word_challenge_play(challenge_id):
    """Play a word challenge"""
    challenge = WordChallenge.query.get_or_404(challenge_id)
    
    # Check if user is part of this challenge
    player = WordChallengePlayer.query.filter_by(
        challenge_id=challenge.id,
        user_id=current_user.id
    ).first()
    
    if not player:
        flash('You are not part of this challenge!', 'danger')
        return redirect(url_for('word_challenges'))
    
    # Check if challenge is in progress
    if challenge.status != 'in_progress':
        flash('This challenge is not in progress!', 'warning')
        return redirect(url_for('word_challenges'))
    
    opponent = WordChallengePlayer.query.filter(
        WordChallengePlayer.challenge_id == challenge.id,
        WordChallengePlayer.user_id != current_user.id
    ).first()
    
    board = challenge.get_board()
    rack = player.get_rack()
    
    # Get AI recommendation if it's the player's turn
    ai_recommendation = None
    if player.is_turn and challenge.challenge_type == 'practice' and opponent.user.email == 'ai@geekprotocol.com':
        ai_recommendation = get_ai_word_recommendation(current_user, rack, board)
    
    # Get character message
    character = get_character_for_context('word_challenge_start')
    character_message = None
    if player.is_turn:
        if character == 'GIGA':
            character_message = get_giga_message(current_user, 'word_challenge_start')
        else:
            character_message = get_ace_message(current_user, 'word_challenge_start')
    
    return render_template('word_challenges/play.html',
                         challenge=challenge,
                         player=player,
                         opponent=opponent,
                         board=board,
                         rack=rack,
                         ai_recommendation=ai_recommendation,
                         character=character,
                         character_message=character_message,
                         LETTER_VALUES=LETTER_VALUES)

@app.route('/api/word_challenge/play_word', methods=['POST'])
@login_required
def api_word_challenge_play_word():
    """Play a word in the challenge - COMPLETELY REWRITTEN AND FIXED"""
    try:
        data = request.get_json()
        if not data:
            return jsonify({'success': False, 'message': 'Invalid JSON payload'})

        challenge_id = data.get('challenge_id')
        word = data.get('word', '').upper().strip()
        start_row = data.get('start_row')
        start_col = data.get('start_col')
        direction = data.get('direction')

        # Validation
        if not all([challenge_id, word, start_row is not None, start_col is not None, direction]):
            return jsonify({'success': False, 'message': 'Missing required fields'})

        if direction not in ['horizontal', 'vertical']:
            return jsonify({'success': False, 'message': 'Invalid direction'})

        if len(word) < 2:
            return jsonify({'success': False, 'message': 'Word must be at least 2 letters long'})

        try:
            start_row = int(start_row)
            start_col = int(start_col)
        except (TypeError, ValueError):
            return jsonify({'success': False, 'message': 'Invalid start position'})

        if not (0 <= start_row < 15 and 0 <= start_col < 15):
            return jsonify({'success': False, 'message': 'Start position out of bounds'})

        # Get challenge and player
        challenge = WordChallenge.query.get(challenge_id)
        if not challenge:
            return jsonify({'success': False, 'message': 'Challenge not found'})

        player = WordChallengePlayer.query.filter_by(
            challenge_id=challenge.id,
            user_id=current_user.id
        ).first()

        if not player:
            return jsonify({'success': False, 'message': 'You are not part of this challenge'})

        if not player.is_turn:
            return jsonify({'success': False, 'message': 'Not your turn!'})

        if challenge.status != 'in_progress':
            return jsonify({'success': False, 'message': 'Challenge is not in progress'})

        # Validate word in dictionary
        if not validate_word(word):
            return jsonify({'success': False, 'message': f'"{word}" is not in the dictionary!'})

        # Get player's rack
        rack = player.get_rack()
        rack_letters = [tile['letter'] for tile in rack]

        # Get board
        board = challenge.get_board()

        # Comprehensive word placement validation
        valid, positions, error = check_word_validity(
            word, rack_letters, board, (start_row, start_col), direction
        )

        if not valid:
            return jsonify({'success': False, 'message': error})

        # Check all cross-words
        cross_valid, cross_error = check_cross_words(word, positions, board)
        if not cross_valid:
            return jsonify({'success': False, 'message': cross_error})

        # Calculate score
        score, tiles_used = calculate_move_score(word, positions, board)

        # Update board
        for i, (row, col) in enumerate(positions):
            if board[row][col]['letter'] is None:
                board[row][col]['letter'] = word[i]
                board[row][col]['player_id'] = player.user_id
                board[row][col]['move_id'] = None  # Will update after move is saved

        challenge.set_board(board)

        # Update player score
        player.score += score

        # Check for bingo
        is_bingo = (tiles_used == 7)
        if is_bingo:
            player.score += 50
            score += 50  # For display purposes

        # Remove used tiles from rack
        tiles_to_remove = []
        for i, pos in enumerate(positions):
            row, col = pos
            if board[row][col]['letter'] == word[i] and board[row][col]['player_id'] == player.user_id:
                tiles_to_remove.append(word[i])

        # Remove tiles from rack
        current_rack = player.get_rack()
        remaining_rack = []

        for tile in current_rack:
            if tile['letter'] in tiles_to_remove:
                tiles_to_remove.remove(tile['letter'])
            else:
                remaining_rack.append(tile)

        player.set_rack(remaining_rack)

        # Draw new tiles
        tiles_needed = 7 - len(remaining_rack)
        if tiles_needed > 0:
            new_tiles = challenge.draw_tiles(tiles_needed)
            remaining_rack.extend(new_tiles)
            player.set_rack(remaining_rack)

        # Record move
        move_count = WordChallengeMove.query.filter_by(challenge_id=challenge.id).count()
        move = WordChallengeMove(
            challenge_id=challenge.id,
            player_id=player.id,
            word_played=word,
            positions=json.dumps(positions),
            score=score,
            tiles_used=tiles_used,
            is_bingo=is_bingo,
            move_number=move_count + 1
        )
        db.session.add(move)
        db.session.flush()

        # Update board with move_id
        board = challenge.get_board()
        for row, col in positions:
            if board[row][col]['player_id'] == player.user_id:
                board[row][col]['move_id'] = move.id
        challenge.set_board(board)

        # Check if challenge is over
        challenge_over = False
        challenge_over_message = None

        if challenge.get_tile_bag_count() == 0:
            # Check if any player has tiles left
            players = WordChallengePlayer.query.filter_by(challenge_id=challenge.id).all()
            all_racks_empty = all(len(p.get_rack()) == 0 for p in players)

            if all_racks_empty:
                challenge_over = True
                challenge.status = 'completed'
                challenge.completed_at = datetime.datetime.utcnow()

                # Subtract remaining tile values from scores
                for p in players:
                    rack_value = sum(tile['value'] for tile in p.get_rack())
                    p.score -= rack_value

                db.session.flush()

                # Determine winner
                if len(players) == 2:
                    if players[0].score > players[1].score:
                        challenge.winner_id = players[0].user_id
                    elif players[1].score > players[0].score:
                        challenge.winner_id = players[1].user_id

                challenge_over_message = f"Challenge Over! Final score: {players[0].score} - {players[1].score}"

                # Update user stats
                for p in players:
                    user = User.query.get(p.user_id)
                    if user:
                        is_win = (p.user_id == challenge.winner_id)
                        is_loss = (challenge.winner_id is not None and p.user_id != challenge.winner_id)
                        is_draw = (challenge.winner_id is None)

                        user.update_word_challenge_stats(
                            score=p.score,
                            is_win=is_win,
                            is_loss=is_loss,
                            is_draw=is_draw,
                            word_played=word if p.user_id == player.user_id else None,
                            is_bingo=is_bingo if p.user_id == player.user_id else False
                        )

        # If not challenge over, switch turn
        if not challenge_over:
            # Switch to other player
            players = WordChallengePlayer.query.filter_by(challenge_id=challenge.id).all()
            current_player_num = player.player_number
            next_player_num = 2 if current_player_num == 1 else 1

            challenge.current_turn = next_player_num
            challenge.pass_count = 0

            for p in players:
                p.is_turn = (p.player_number == next_player_num)

        db.session.commit()

        # Update user stats for current player
        current_user.update_word_challenge_stats(
            score=score,
            word_played=word,
            is_bingo=is_bingo
        )

        # Check for achievements
        check_achievements(current_user, 'word_challenge_wins', current_user.word_challenge_wins)
        check_achievements(current_user, 'word_challenge_bingos', current_user.word_challenge_bingos)
        check_achievements(current_user, 'word_challenge_high_score', current_user.word_challenge_high_score)

        # Update daily challenge progress
        today = datetime.date.today()
        challenge = WordChallengeDailyChallenge.query.filter_by(date=today).first()
        if challenge:
            progress = WordChallengeUserProgress.query.filter_by(
                user_id=current_user.id,
                challenge_id=challenge.id
            ).first()

            if not progress:
                progress = WordChallengeUserProgress(
                    user_id=current_user.id,
                    challenge_id=challenge.id
                )
                db.session.add(progress)

            progress.total_score += score
            progress.total_words += 1
            progress.challenges_played += 1
            progress.last_updated = datetime.datetime.utcnow()

            if progress.total_score >= challenge.target_score and progress.total_words >= challenge.target_words:
                progress.completed = True

                # Award rewards
                current_user.xp += challenge.bonus_xp
                current_user.geek_balance += challenge.bonus_geek
                current_user.total_earned_geek += challenge.bonus_geek

            db.session.commit()

        # Character interaction
        if is_bingo:
            current_user.add_character_interaction('GIGA', 'bingo_scored', {
                'challenge_id': challenge.id,
                'word': word,
                'score': score
            })
            db.session.add(StickerPack(
                user_id=current_user.id,
                pack_type='premium',
                source='bingo',
                source_detail=f'Bingo with word: {word}'
            ))
            session['pending_pack_notification'] = '🎁 Bingo reward: 1 premium sticker pack!'
            db.session.commit()

        response_data = {
            'success': True,
            'challenge_over': challenge_over,
            'score': score,
            'total_score': player.score,
            'word': word,
            'is_bingo': is_bingo,
            'next_turn': challenge.current_turn if not challenge_over else None
        }

        if challenge_over_message:
            response_data['message'] = challenge_over_message

        return jsonify(response_data)

    except Exception as e:
        db.session.rollback()
        print(f"Error in play_word: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'message': f'Server error: {str(e)}'})


@app.route('/api/word_challenge/pass_turn', methods=['POST'])
@login_required
def api_word_challenge_pass_turn():
    """Pass the turn - COMPLETELY REWRITTEN AND FIXED"""
    try:
        data = request.get_json()
        if not data:
            return jsonify({'success': False, 'message': 'Invalid JSON payload'})

        challenge_id = data.get('challenge_id')
        if not challenge_id:
            return jsonify({'success': False, 'message': 'Missing challenge_id'})

        challenge = WordChallenge.query.get(challenge_id)
        if not challenge:
            return jsonify({'success': False, 'message': 'Challenge not found'})

        player = WordChallengePlayer.query.filter_by(
            challenge_id=challenge.id,
            user_id=current_user.id
        ).first()

        if not player:
            return jsonify({'success': False, 'message': 'You are not part of this challenge'})

        if not player.is_turn:
            return jsonify({'success': False, 'message': 'Not your turn!'})

        if challenge.status != 'in_progress':
            return jsonify({'success': False, 'message': 'Challenge is not in progress'})

        # Increment pass count
        challenge.pass_count += 1

        # Check if challenge should end (3 consecutive passes)
        challenge_over = False
        if challenge.pass_count >= challenge.max_passes:
            challenge_over = True
            challenge.status = 'completed'
            challenge.completed_at = datetime.datetime.utcnow()

            # Determine winner (higher score wins)
            players = WordChallengePlayer.query.filter_by(challenge_id=challenge.id).all()
            if len(players) == 2:
                if players[0].score > players[1].score:
                    challenge.winner_id = players[0].user_id
                elif players[1].score > players[0].score:
                    challenge.winner_id = players[1].user_id

                # Update user stats
                for p in players:
                    user = User.query.get(p.user_id)
                    if user:
                        is_win = (p.user_id == challenge.winner_id)
                        is_loss = (challenge.winner_id is not None and p.user_id != challenge.winner_id)
                        is_draw = (challenge.winner_id is None)

                        user.update_word_challenge_stats(
                            score=p.score,
                            is_win=is_win,
                            is_loss=is_loss,
                            is_draw=is_draw
                        )

        # If not challenge over, switch turn
        if not challenge_over:
            # Switch to other player
            players = WordChallengePlayer.query.filter_by(challenge_id=challenge.id).all()
            current_player_num = player.player_number
            next_player_num = 2 if current_player_num == 1 else 1

            challenge.current_turn = next_player_num

            for p in players:
                p.is_turn = (p.player_number == next_player_num)

        db.session.commit()

        return jsonify({
            'success': True,
            'challenge_over': challenge_over,
            'next_turn': challenge.current_turn if not challenge_over else None,
            'message': 'Challenge ended by mutual agreement' if challenge_over else 'Turn passed'
        })

    except Exception as e:
        db.session.rollback()
        print(f"Error in pass_turn: {str(e)}")
        return jsonify({'success': False, 'message': f'Server error: {str(e)}'})


@app.route('/api/word_challenge/resign', methods=['POST'])
@login_required
def api_word_challenge_resign():
    """Resign from the challenge - COMPLETELY REWRITTEN AND FIXED"""
    try:
        data = request.get_json()
        if not data:
            return jsonify({'success': False, 'message': 'Invalid JSON payload'})

        challenge_id = data.get('challenge_id')
        if not challenge_id:
            return jsonify({'success': False, 'message': 'Missing challenge_id'})

        challenge = WordChallenge.query.get(challenge_id)
        if not challenge:
            return jsonify({'success': False, 'message': 'Challenge not found'})

        player = WordChallengePlayer.query.filter_by(
            challenge_id=challenge.id,
            user_id=current_user.id
        ).first()

        if not player:
            return jsonify({'success': False, 'message': 'You are not part of this challenge'})

        if challenge.status != 'in_progress':
            return jsonify({'success': False, 'message': 'Challenge is not in progress'})

        # End the challenge
        challenge.status = 'completed'
        challenge.completed_at = datetime.datetime.utcnow()

        # Other player wins
        players = WordChallengePlayer.query.filter_by(challenge_id=challenge.id).all()
        for p in players:
            if p.user_id != current_user.id:
                challenge.winner_id = p.user_id

        db.session.flush()

        # Update user stats
        for p in players:
            user = User.query.get(p.user_id)
            if user:
                if p.user_id == current_user.id:
                    # Resigning player loses
                    user.update_word_challenge_stats(score=p.score, is_loss=True)
                    user.add_character_interaction('GIGA', 'word_challenge_loss', {
                        'challenge_id': challenge.id,
                        'score': p.score,
                        'by_resignation': True
                    })
                else:
                    # Opponent wins
                    user.update_word_challenge_stats(score=p.score, is_win=True)
                    user.add_character_interaction('GIGA', 'word_challenge_win', {
                        'challenge_id': challenge.id,
                        'score': p.score,
                        'by_resignation': True
                    })
                user.update_level()

        db.session.commit()

        return jsonify({
            'success': True,
            'challenge_over': True,
            'message': 'You resigned from the challenge'
        })

    except Exception as e:
        db.session.rollback()
        print(f"Error in resign: {str(e)}")
        return jsonify({'success': False, 'message': f'Server error: {str(e)}'})


@app.route('/api/word_challenge/send_chat', methods=['POST'])
@login_required
def api_word_challenge_send_chat():
    """Send a chat message - COMPLETELY REWRITTEN AND FIXED"""
    try:
        data = request.get_json()
        if not data:
            return jsonify({'success': False, 'message': 'Invalid JSON payload'})

        challenge_id = data.get('challenge_id')
        message = data.get('message', '').strip()

        if not challenge_id:
            return jsonify({'success': False, 'message': 'Missing challenge_id'})

        if not message:
            return jsonify({'success': False, 'message': 'Message cannot be empty'})

        if len(message) > 200:
            message = message[:200]

        challenge = WordChallenge.query.get(challenge_id)
        if not challenge:
            return jsonify({'success': False, 'message': 'Challenge not found'})

        # Check if user is part of this challenge
        player = WordChallengePlayer.query.filter_by(
            challenge_id=challenge.id,
            user_id=current_user.id
        ).first()

        if not player:
            return jsonify({'success': False, 'message': 'You are not part of this challenge'})

        # Create chat message
        chat = WordChallengeChat(
            challenge_id=challenge.id,
            user_id=current_user.id,
            message=message
        )

        db.session.add(chat)
        db.session.commit()

        return jsonify({
            'success': True,
            'chat': chat.to_dict()
        })

    except Exception as e:
        db.session.rollback()
        print(f"Error in send_chat: {str(e)}")
        return jsonify({'success': False, 'message': f'Server error: {str(e)}'})


@app.route('/api/word_challenge/board/<int:challenge_id>')
@login_required
def api_word_challenge_board(challenge_id):
    """Get current challenge state - COMPLETELY REWRITTEN AND FIXED"""
    try:
        challenge = WordChallenge.query.get(challenge_id)
        if not challenge:
            return jsonify({'success': False, 'message': 'Challenge not found'})

        # Check if user is part of this challenge
        player = WordChallengePlayer.query.filter_by(
            challenge_id=challenge.id,
            user_id=current_user.id
        ).first()

        if not player:
            return jsonify({'success': False, 'message': 'You are not part of this challenge'})

        # Get opponent
        opponent = WordChallengePlayer.query.filter(
            WordChallengePlayer.challenge_id == challenge.id,
            WordChallengePlayer.user_id != current_user.id
        ).first()

        # Handle AI move in practice mode
        if (challenge.challenge_type == 'practice' and
            challenge.status == 'in_progress' and
            challenge.current_turn == 2 and
            opponent and
            opponent.user and
            opponent.user.email == 'ai@geekprotocol.com'):

            # AI makes a move based on player skill
            ai_difficulty = get_ai_difficulty_level(current_user)
            ai_made_move = ai_advanced_move(challenge, opponent, ai_difficulty)
            if ai_made_move:
                db.session.commit()

        # Get fresh challenge state
        challenge = WordChallenge.query.get(challenge_id)
        player = WordChallengePlayer.query.filter_by(
            challenge_id=challenge.id,
            user_id=current_user.id
        ).first()
        opponent = WordChallengePlayer.query.filter(
            WordChallengePlayer.challenge_id == challenge.id,
            WordChallengePlayer.user_id != current_user.id
        ).first()

        board = challenge.get_board()
        player_rack = player.get_rack()

        # Prepare opponent rack display (hidden)
        opponent_rack_display = []
        if opponent:
            opponent_rack = opponent.get_rack()
            opponent_rack_display = [{'letter': '?', 'value': 0} for _ in opponent_rack]

        # Get recent moves (last 10)
        recent_moves = WordChallengeMove.query.filter_by(challenge_id=challenge.id)\
            .order_by(WordChallengeMove.move_number.desc()).limit(10).all()

        # Get chat messages from last hour
        hour_ago = datetime.datetime.utcnow() - datetime.timedelta(hours=1)
        chat_messages = WordChallengeChat.query.filter(
            WordChallengeChat.challenge_id == challenge.id,
            WordChallengeChat.timestamp >= hour_ago
        ).order_by(WordChallengeChat.timestamp.asc()).all()

        return jsonify({
            'success': True,
            'challenge': challenge.to_dict(),
            'board': board,
            'player': {
                'id': player.id,
                'user_id': player.user_id,
                'username': player.user.username if player.user else 'Player',
                'score': player.score,
                'rack': player_rack,
                'is_turn': player.is_turn
            },
            'opponent': {
                'id': opponent.id if opponent else None,
                'user_id': opponent.user_id if opponent else None,
                'username': opponent.user.username if opponent and opponent.user else 'A.C.E.',
                'score': opponent.score if opponent else 0,
                'rack': opponent_rack_display,
                'is_turn': opponent.is_turn if opponent else False
            } if opponent else None,
            'moves': [move.to_dict() for move in recent_moves],
            'chat': [msg.to_dict() for msg in chat_messages],
            'tiles_remaining': challenge.get_tile_bag_count()
        })

    except Exception as e:
        print(f"Error in board endpoint: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'message': f'Server error: {str(e)}'})


def get_ai_difficulty_level(user):
    """Determine AI difficulty based on player skill"""
    if user.word_challenge_wins == 0 and user.word_challenge_total_score == 0:
        return 'beginner'

    win_rate = user.word_challenge_wins / max(1, (user.word_challenge_wins + user.word_challenge_losses))
    avg_score = user.word_challenge_total_score / max(1, (user.word_challenge_wins + user.word_challenge_losses))

    if win_rate < 0.3 or avg_score < 100:
        return 'beginner'
    if win_rate < 0.5 or avg_score < 200:
        return 'intermediate'
    if win_rate < 0.7 or avg_score < 300:
        return 'advanced'
    return 'expert'


def get_ai_word_suggestions(rack_letters, board, difficulty='beginner'):
    """Get smart word suggestions based on difficulty"""
    suggestions = []
    rack_letters_list = list(rack_letters)

    possible_words = []
    for word in DICTIONARY:
        if 2 <= len(word) <= 7:
            temp_rack = rack_letters_list.copy()
            possible = True
            for letter in word:
                if letter in temp_rack:
                    temp_rack.remove(letter)
                elif '?' in temp_rack:
                    temp_rack.remove('?')
                else:
                    possible = False
                    break
            if possible:
                possible_words.append(word)
                if len(possible_words) > 50:
                    break

    if not possible_words:
        return []

    scored_words = []
    for word in possible_words:
        for i in range(15):
            for j in range(15 - len(word) + 1):
                valid, positions, _ = check_word_validity(word, rack_letters_list, board, (i, j), 'horizontal')
                if valid:
                    cross_valid, _ = check_cross_words(word, positions, board)
                    if cross_valid:
                        score, _ = calculate_move_score(word, positions, board)
                        if difficulty == 'beginner' and len(word) <= 4:
                            score *= 1.2
                        elif difficulty in ['advanced', 'expert']:
                            if len(word) == 7:
                                score *= 1.5
                            elif len(word) >= 5:
                                score *= 1.2
                        scored_words.append({
                            'word': word,
                            'score': score,
                            'positions': positions,
                            'direction': 'horizontal',
                            'start': (i, j)
                        })
            for j in range(15):
                for i in range(15 - len(word) + 1):
                    valid, positions, _ = check_word_validity(word, rack_letters_list, board, (i, j), 'vertical')
                    if valid:
                        cross_valid, _ = check_cross_words(word, positions, board)
                        if cross_valid:
                            score, _ = calculate_move_score(word, positions, board)
                            if difficulty == 'beginner' and len(word) <= 4:
                                score *= 1.2
                            elif difficulty in ['advanced', 'expert']:
                                if len(word) == 7:
                                    score *= 1.5
                                elif len(word) >= 5:
                                    score *= 1.2
                            scored_words.append({
                                'word': word,
                                'score': score,
                                'positions': positions,
                                'direction': 'vertical',
                                'start': (i, j)
                            })

    scored_words.sort(key=lambda x: x['score'], reverse=True)
    if difficulty == 'beginner':
        return scored_words[:3]
    if difficulty == 'intermediate':
        return scored_words[:5]
    return scored_words[:7]


def get_tile_hints(rack_letters, board):
    """Generate helpful hints for the player"""
    hints = []

    high_value_letters = ['Q', 'Z', 'J', 'X', 'K']
    for letter in high_value_letters:
        if letter in rack_letters:
            hints.append(f"💎 You have a high-value letter '{letter}' worth {LETTER_VALUES.get(letter, 0)} points!")

    if len(rack_letters) == 7:
        hints.append("🎯 BINGO OPPORTUNITY! Use all 7 tiles for a 50-point bonus!")

    common_hooks = ['S', 'R', 'E', 'D']
    for hook in common_hooks:
        if hook in rack_letters:
            hints.append(f"🔤 You have '{hook}' - great for adding to existing words!")

    if '?' in rack_letters:
        hints.append("✨ You have a blank tile - it can be ANY letter!")

    for i in range(15):
        for j in range(15):
            if not board[i][j]['letter']:
                bonus = board[i][j]['bonus']
                if bonus == 'TWS':
                    hints.append(f"🎯 Triple Word Score available at ({i},{j})!")
                elif bonus == 'DWS':
                    hints.append(f"🎯 Double Word Score available at ({i},{j})!")
                elif bonus == 'TLS' and any(l in rack_letters for l in high_value_letters):
                    hints.append(f"🎯 Triple Letter Score at ({i},{j}) - perfect for high-value letters!")

    return list(set(hints))[:5]


def get_best_placement_advice(rack_letters, board):
    """Give specific advice about where to place tiles"""
    advice = []
    best_premium = None
    best_score = 0

    for i in range(15):
        for j in range(15):
            if not board[i][j]['letter']:
                bonus = board[i][j]['bonus']
                if bonus in ['TWS', 'DWS', 'TLS', 'DLS']:
                    if bonus in ['TLS', 'DLS'] and rack_letters:
                        max_letter = max(rack_letters, key=lambda l: LETTER_VALUES.get(l, 0))
                        if LETTER_VALUES.get(max_letter, 0) > best_score:
                            best_score = LETTER_VALUES.get(max_letter, 0)
                            best_premium = (i, j, bonus, max_letter)

    if best_premium:
        i, j, bonus, letter = best_premium
        if bonus == 'TLS':
            advice.append(f"💡 Place your '{letter}' on the Triple Letter Score at ({i},{j}) for {LETTER_VALUES.get(letter, 0)*3} points!")
        elif bonus == 'DLS':
            advice.append(f"💡 Place your '{letter}' on the Double Letter Score at ({i},{j}) for {LETTER_VALUES.get(letter, 0)*2} points!")

    return advice


def ai_advanced_move(challenge, ai_player, difficulty):
    """Enhanced AI move with difficulty levels"""
    board = challenge.get_board()
    ai_rack = ai_player.get_rack()

    if not ai_rack:
        return False

    rack_letters = [tile['letter'] for tile in ai_rack]
    suggestions = get_ai_word_suggestions(rack_letters, board, difficulty)

    if suggestions:
        if difficulty == 'beginner' and random.random() < 0.3 and len(suggestions) > 1:
            best_move = suggestions[1]
        elif difficulty == 'intermediate' and random.random() < 0.2 and len(suggestions) > 1:
            best_move = suggestions[1]
        else:
            best_move = suggestions[0]

        word = best_move['word'].upper()
        positions = best_move['positions']
        score = best_move['score']

        for i, pos in enumerate(positions):
            row, col = pos
            board[row][col]['letter'] = word[i]
            board[row][col]['player_id'] = ai_player.user_id

        challenge.set_board(board)
        ai_player.score += score

        is_bingo = (len(word) == 7)
        if is_bingo:
            ai_player.score += 50
            score += 50

        tiles_to_remove = list(word)
        current_rack = ai_player.get_rack()
        remaining_rack = []
        for tile in current_rack:
            if tile['letter'] in tiles_to_remove:
                tiles_to_remove.remove(tile['letter'])
            else:
                remaining_rack.append(tile)
        ai_player.set_rack(remaining_rack)

        tiles_needed = 7 - len(remaining_rack)
        if tiles_needed > 0:
            new_tiles = challenge.draw_tiles(tiles_needed)
            remaining_rack.extend(new_tiles)
            ai_player.set_rack(remaining_rack)

        move_count = WordChallengeMove.query.filter_by(challenge_id=challenge.id).count()
        move = WordChallengeMove(
            challenge_id=challenge.id,
            player_id=ai_player.id,
            word_played=word,
            positions=json.dumps(positions),
            score=score,
            tiles_used=len(word),
            is_bingo=is_bingo,
            move_number=move_count + 1
        )
        db.session.add(move)
        db.session.flush()

        board = challenge.get_board()
        for row, col in positions:
            board[row][col]['move_id'] = move.id
        challenge.set_board(board)

        challenge.current_turn = 1
        players = WordChallengePlayer.query.filter_by(challenge_id=challenge.id).all()
        for p in players:
            p.is_turn = (p.player_number == 1)

        return True

    challenge.pass_count += 1
    challenge.current_turn = 1
    players = WordChallengePlayer.query.filter_by(challenge_id=challenge.id).all()
    for p in players:
        p.is_turn = (p.player_number == 1)
    return False


def ai_make_move(challenge, ai_player):
    """Backward-compatible AI entrypoint."""
    return ai_advanced_move(challenge, ai_player, 'intermediate')


@app.route('/api/word_challenge/hints', methods=['GET'])
@login_required
def api_word_challenge_hints():
    """Get hints and suggestions for current challenge state"""
    challenge_id = request.args.get('challenge_id')
    if not challenge_id:
        return jsonify({'success': False, 'message': 'Missing challenge_id'})

    challenge = WordChallenge.query.get(challenge_id)
    if not challenge:
        return jsonify({'success': False, 'message': 'Challenge not found'})

    player = WordChallengePlayer.query.filter_by(challenge_id=challenge.id, user_id=current_user.id).first()
    if not player:
        return jsonify({'success': False, 'message': 'You are not part of this challenge'})

    board = challenge.get_board()
    rack = player.get_rack()
    rack_letters = [tile['letter'] for tile in rack]

    difficulty = get_ai_difficulty_level(current_user)
    suggestions = get_ai_word_suggestions(rack_letters, board, difficulty)
    hints = get_tile_hints(rack_letters, board)
    advice = get_best_placement_advice(rack_letters, board)

    character = get_character_for_context('word_challenge_hint')
    if suggestions:
        top_suggestion = suggestions[0]
        if character == 'GIGA':
            character_message = f"I think '{top_suggestion['word']}' for {top_suggestion['score']} points would be great! You can do this! 💪"
        else:
            character_message = (
                f"Optimal play: '{top_suggestion['word']}' at {top_suggestion['start']} "
                f"for {top_suggestion['score']} points. Efficiency rating: {top_suggestion['score']/30:.1f}/10 📊"
            )
    else:
        if character == 'GIGA':
            character_message = "Don't worry! Sometimes passing is the best strategy. Maybe swap some tiles? 🔄"
        else:
            character_message = "No optimal moves found. Consider passing or exchanging tiles."

    return jsonify({
        'success': True,
        'suggestions': [{
            'word': s['word'],
            'score': s['score'],
            'direction': s['direction'],
            'start': s['start']
        } for s in suggestions[:5]],
        'hints': hints,
        'placement_advice': advice[:3],
        'character': character,
        'character_message': character_message,
        'difficulty': difficulty
    })


@app.route('/api/word_challenge/swap_tiles', methods=['POST'])
@login_required
def api_word_challenge_swap_tiles():
    """Swap tiles in practice mode"""
    try:
        data = request.get_json()
        if not data:
            return jsonify({'success': False, 'message': 'Invalid JSON payload'})

        challenge_id = data.get('challenge_id')
        letters = data.get('letters', [])
        if not challenge_id:
            return jsonify({'success': False, 'message': 'Missing challenge_id'})
        if not letters:
            return jsonify({'success': False, 'message': 'No letters selected to swap'})

        challenge = WordChallenge.query.get(challenge_id)
        if not challenge:
            return jsonify({'success': False, 'message': 'Challenge not found'})
        if challenge.challenge_type != 'practice':
            return jsonify({'success': False, 'message': 'Can only swap tiles in practice mode'})

        player = WordChallengePlayer.query.filter_by(challenge_id=challenge.id, user_id=current_user.id).first()
        if not player:
            return jsonify({'success': False, 'message': 'You are not part of this challenge'})
        if not player.is_turn:
            return jsonify({'success': False, 'message': 'Not your turn!'})

        swap_count = len(letters)
        requested_letters = list(letters)
        rack = player.get_rack()
        rack_letters = [tile['letter'] for tile in rack]
        for letter in requested_letters:
            if letter not in rack_letters:
                return jsonify({'success': False, 'message': f"You don't have the letter '{letter}'"})
            rack_letters.remove(letter)

        tile_bag = json.loads(challenge.tile_bag)
        remaining_rack = []
        to_remove = list(requested_letters)
        for tile in rack:
            if tile['letter'] in to_remove:
                to_remove.remove(tile['letter'])
                tile_bag.append(tile)
            else:
                remaining_rack.append(tile)

        random.shuffle(tile_bag)
        challenge.tile_bag = json.dumps(tile_bag)

        tiles_needed = 7 - len(remaining_rack)
        new_tiles = challenge.draw_tiles(tiles_needed)
        remaining_rack.extend(new_tiles)
        player.set_rack(remaining_rack)

        challenge.current_turn = 2
        players = WordChallengePlayer.query.filter_by(challenge_id=challenge.id).all()
        for p in players:
            p.is_turn = (p.player_number == 2)

        db.session.commit()

        return jsonify({
            'success': True,
            'message': f'Swapped {swap_count} tiles and passed turn',
            'rack': [{'letter': t['letter'], 'value': t['value']} for t in remaining_rack]
        })

    except Exception as e:
        db.session.rollback()
        print(f"Error in swap_tiles: {str(e)}")
        return jsonify({'success': False, 'message': f'Server error: {str(e)}'})


@app.route('/api/word_challenge/analyze_board', methods=['GET'])
@login_required
def api_word_challenge_analyze_board():
    """Analyze board and provide strategic insights"""
    challenge_id = request.args.get('challenge_id')
    if not challenge_id:
        return jsonify({'success': False, 'message': 'Missing challenge_id'})

    challenge = WordChallenge.query.get(challenge_id)
    if not challenge:
        return jsonify({'success': False, 'message': 'Challenge not found'})

    player = WordChallengePlayer.query.filter_by(challenge_id=challenge.id, user_id=current_user.id).first()
    if not player:
        return jsonify({'success': False, 'message': 'You are not part of this challenge'})

    board = challenge.get_board()
    rack = player.get_rack()
    rack_letters = [tile['letter'] for tile in rack]

    analysis = {
        'premium_squares_remaining': 0,
        'tiles_in_bag': challenge.get_tile_bag_count(),
        'player_score': player.score,
        'recommended_strategy': '',
        'score_projection': 0
    }

    for i in range(15):
        for j in range(15):
            if not board[i][j]['letter'] and board[i][j]['bonus']:
                analysis['premium_squares_remaining'] += 1

    if analysis['premium_squares_remaining'] > 10:
        analysis['recommended_strategy'] = "Focus on claiming premium squares early!"
    elif len(rack_letters) >= 6:
        analysis['recommended_strategy'] = "You have many tiles - look for bingo opportunities!"
    elif any(l in ['Q', 'Z', 'J', 'X'] for l in rack_letters):
        analysis['recommended_strategy'] = "Use your high-value letters on bonus squares!"
    elif analysis['tiles_in_bag'] < 10:
        analysis['recommended_strategy'] = "Endchallenge - defensive play, block opponent's opportunities!"
    else:
        analysis['recommended_strategy'] = "Build parallel words to maximize scoring!"

    if challenge.started_at:
        elapsed = (datetime.datetime.utcnow() - challenge.started_at).total_seconds()
        if elapsed > 0:
            score_rate = player.score / elapsed
            remaining_time = 1200
            analysis['score_projection'] = int(player.score + (score_rate * remaining_time))

    return jsonify({
        'success': True,
        'analysis': analysis
    })
@app.route('/api/word_challenge/daily_challenge')
@login_required
def api_word_challenge_daily_challenge():
    """Get daily challenge status"""
    today = datetime.date.today()
    challenge = WordChallengeDailyChallenge.query.filter_by(date=today).first()
    
    if not challenge:
        challenge = create_daily_challenge()
    
    progress = WordChallengeUserProgress.query.filter_by(
        user_id=current_user.id,
        challenge_id=challenge.id
    ).first()
    
    return jsonify({
        'success': True,
        'challenge': {
            'id': challenge.id,
            'description': challenge.description,
            'target_score': challenge.target_score,
            'target_words': challenge.target_words,
            'bonus_geek': challenge.bonus_geek,
            'bonus_xp': challenge.bonus_xp
        },
        'progress': {
            'challenges_played': progress.challenges_played if progress else 0,
            'total_score': progress.total_score if progress else 0,
            'total_words': progress.total_words if progress else 0,
            'completed': progress.completed if progress else False,
            'reward_claimed': progress.reward_claimed if progress else False
        } if progress else None
    })

# ==================== AI API ENDPOINTS ====================

@app.route('/api/ai/question_analysis/<int:question_id>', methods=['GET'])
@login_required
def api_question_analysis(question_id):
    """Get AI analysis for a specific question"""
    question = Question.query.get_or_404(question_id)
    analysis = get_question_context_analysis(question, current_user)
    
    return jsonify({
        'success': True,
        'analysis': analysis
    })

@app.route('/api/ai/recommendation', methods=['GET'])
@login_required
def api_ai_recommendation():
    """Get personalized AI recommendation"""
    recommendation = generate_ai_recommendation(current_user)
    
    ai_rec = AIRecommendation(
        user_id=current_user.id,
        recommendation_type=recommendation['type'],
        content=recommendation['message'],
        context=json.dumps(recommendation)
    )
    db.session.add(ai_rec)
    db.session.commit()
    
    return jsonify({
        'success': True,
        'recommendation': recommendation
    })

@app.route('/api/ai/topic_knowledge/<int:topic_id>', methods=['GET'])
@login_required
def api_topic_knowledge(topic_id):
    """Get knowledge base information for a topic"""
    topic = Topic.query.get_or_404(topic_id)
    knowledge = get_knowledge_for_topic(topic.name)
    
    if knowledge:
        return jsonify({
            'success': True,
            'topic': topic.name,
            'emoji': knowledge.get('emoji', '📚'),
            'core_topics': knowledge.get('core_topics', []),
            'fun_facts': knowledge.get('key_facts', {})
        })
    else:
        return jsonify({
            'success': False,
            'message': 'No detailed knowledge available for this topic'
        })

@app.route('/api/ai/search', methods=['POST'])
@login_required
def api_ai_search():
    """AI search endpoint - answer questions using knowledge base"""
    query = request.json.get('query', '').lower()
    topic_id = request.json.get('topic_id')
    
    results = []
    
    for domain_key, domain in AI_KNOWLEDGE.get('knowledge_domains', {}).items():
        if topic_id:
            topic = Topic.query.get(topic_id)
            if topic and domain.get('name') != topic.name:
                continue
        
        if query in domain.get('name', '').lower() or query in domain.get('emoji', '').lower():
            results.append({
                'type': 'domain',
                'title': domain.get('name', ''),
                'emoji': domain.get('emoji', ''),
                'content': domain.get('core_topics', [])[:3]
            })
        
        for topic, facts in domain.get('key_facts', {}).items():
            for fact in facts[:5]:
                if query in fact.lower():
                    results.append({
                        'type': 'fact',
                        'topic': topic.replace('_', ' ').title(),
                        'content': fact,
                        'emoji': domain.get('emoji', '')
                    })
    
    for domain_key, domain in AI_KNOWLEDGE.get('knowledge_domains', {}).items():
        common_qs = domain.get('common_questions', {})
        for q_type, q_dict in common_qs.items():
            for key, answer in q_dict.items():
                if query in key or query in answer.lower():
                    results.append({
                        'type': 'answer',
                        'question': f"What is the {q_type} of {key}?",
                        'answer': answer,
                        'emoji': domain.get('emoji', '')
                    })
    
    results = results[:10]
    
    ai_rec = AIRecommendation(
        user_id=current_user.id,
        recommendation_type='search',
        content=f"Searched for: {query}",
        context=json.dumps({'results_count': len(results)})
    )
    db.session.add(ai_rec)
    db.session.commit()
    
    return jsonify({
        'success': True,
        'query': query,
        'results': results,
        'count': len(results)
    })

@app.route('/api/ai/quick_tip', methods=['GET'])
@login_required
def api_quick_tip():
    """Get a quick AI tip based on user's current state"""
    tip = ""
    
    weak = current_user.get_weak_topics(threshold=60)
    if weak:
        cat = Topic.query.get(weak[0]['topic_id'])
        tip = f"📊 Focus on {cat.name} - your accuracy is {weak[0]['accuracy']}%. Try 5 questions in this topic today!"
    
    elif current_user.word_challenge_bingos == 0 and current_user.word_challenge_total_score > 0:
        tip = "🎯 Bingo bonus! Try to use all 7 tiles at once for a 50-point bonus!"
    
    elif current_user.current_streak > 0 and current_user.current_streak % 5 == 0:
        days_to_milestone = 7 - (current_user.current_streak % 7)
        tip = f"🔥 {days_to_milestone} days until your next streak milestone! Don't break the chain!"
    
    elif current_user.level >= CCE_MIN_LEVEL_FOR_CREATION and current_user.questions_submitted == 0:
        tip = f"✍️ You can now create questions! Share your knowledge and earn GEEK tokens!"
    
    else:
        tips = [
            "💡 Answering quickly earns a time bonus! Try to answer within 10 seconds.",
            "🎯 Consistency beats intensity - a little each day adds up!",
            "🏆 You're just 100 XP from earning a new achievement badge!",
            "📚 Diversify your topics - well-rounded knowledge pays off in Gauntlet!",
            "🔤 Save high-value letters like Q, Z, J, X for bonus squares in word challenges!",
            "⚡ Your {}-day streak is earning you a {:.1f}x multiplier!".format(
                current_user.current_streak, 
                get_streak_multiplier(current_user.current_streak)
            )
        ]
        tip = random.choice(tips)
    
    return jsonify({
        'success': True,
        'tip': tip
    })

@app.route('/api/ai/misconception_check', methods=['POST'])
@login_required
def api_misconception_check():
    """Check if a common misconception exists for the given topic"""
    topic = request.json.get('topic', '').lower()
    
    misconceptions = AI_KNOWLEDGE.get('error_corrections', {}).get('common_misconceptions', {})
    
    results = []
    for domain, domain_misconceptions in misconceptions.items():
        for misconception in domain_misconceptions:
            if topic in misconception.lower():
                results.append({
                    'domain': domain.replace('_', ' ').title(),
                    'correction': misconception
                })
    
    return jsonify({
        'success': True,
        'has_misconceptions': len(results) > 0,
        'results': results
    })

# ==================== EXISTING ROUTES (Keep all your original routes) ====================

@app.context_processor
def utility_processor():
    def get_pending_notifications():
        achievements = session.pop('pending_achievement_notifications', [])
        packs = session.pop('pending_pack_notification', None)
        misc = session.pop('pending_notifications', [])
        return {'achievements': achievements, 'packs': packs, 'misc': misc}

    return dict(
        get_streak_multiplier=get_streak_multiplier,
        get_round_total_reward=get_round_total_reward,
        get_round_reward_per_question=get_round_reward_per_question,
        get_question_base_reward=get_question_base_reward,
        get_topics=lambda: Topic.query.filter_by(is_active=True).all(),
        get_topic_icon_url=get_topic_icon_url,
        get_sticker_geek_cost=get_sticker_geek_cost,
        get_sticker_geek_value=get_sticker_geek_value,
        CCE_REVIEW_REWARD_GEEK=CCE_REVIEW_REWARD_GEEK,
        CCE_CREATOR_REWARD_PER_SERVE=CCE_CREATOR_REWARD_PER_SERVE,
        CCE_MAX_EARNINGS_PER_QUESTION=CCE_MAX_EARNINGS_PER_QUESTION,
        CCE_APPROVALS_NEEDED=CCE_APPROVALS_NEEDED,
        CCE_MIN_LEVEL_FOR_CREATION=CCE_MIN_LEVEL_FOR_CREATION,
        CCE_MIN_LEVEL_FOR_REVIEW=CCE_MIN_LEVEL_FOR_REVIEW,
        get_character_message=lambda user, character, context: user.get_character_message(character, context) if user else None,
        get_character_for_context=get_character_for_context,
        get_knowledge_for_topic=get_knowledge_for_topic,
        AI_KNOWLEDGE_VERSION=AI_KNOWLEDGE.get('version', '1.0'),
        LETTER_VALUES=LETTER_VALUES,
        get_level_stage=get_level_stage,
        LEVEL_STAGES=LEVEL_STAGES,
        pending_notifications=get_pending_notifications,
        get_dust_value=lambda rarity: DUST_VALUES.get(rarity, 5),
        CRAFTING_COSTS=CRAFTING_COSTS,
        DUST_VALUES=DUST_VALUES
    )

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/check_username', methods=['POST'])
def check_username():
    """API endpoint to check if username is available"""
    username = request.json.get('username', '').strip()
    
    if not username:
        return jsonify({'available': False, 'message': 'Username cannot be empty'})
    
    if len(username) < 3 or len(username) > 50:
        return jsonify({'available': False, 'message': 'Username must be 3-50 characters'})
    
    if not username.replace('_', '').replace('-', '').isalnum():
        return jsonify({'available': False, 'message': 'Username can only contain letters, numbers, underscores and hyphens'})
    
    existing = User.query.filter_by(username=username).first()
    
    if existing:
        return jsonify({'available': False, 'message': 'Username already taken'})
    
    return jsonify({'available': True, 'message': 'Username available'})

@app.route('/register', methods=['GET', 'POST'])
def register():
    if request.method == 'POST':
        username = request.form.get('username', '').strip()
        email = request.form.get('email')
        password = request.form.get('password')
        confirm_password = request.form.get('confirm_password')
        role = request.form.get('role', 'player')
        
        # Validate username
        if not username:
            flash('Username is required!', 'danger')
            return redirect(url_for('register'))
        
        if len(username) < 3 or len(username) > 50:
            flash('Username must be between 3 and 50 characters!', 'danger')
            return redirect(url_for('register'))
        
        if not username.replace('_', '').replace('-', '').isalnum():
            flash('Username can only contain letters, numbers, underscores and hyphens!', 'danger')
            return redirect(url_for('register'))
        
        if password != confirm_password:
            flash('Passwords do not match!', 'danger')
            return redirect(url_for('register'))
        
        # Check if username or email already exists
        if User.query.filter_by(username=username).first():
            flash('Username already taken! Please choose another one.', 'danger')
            return redirect(url_for('register'))
            
        if User.query.filter_by(email=email).first():
            flash('Email already registered!', 'danger')
            return redirect(url_for('register'))
        
        user = User(
            username=username,
            email=email, 
            role=role
        )
        user.set_password(password)
        
        if User.query.count() == 0:
            user.is_admin = True
            user.role = 'admin'
            
        db.session.add(user)
        db.session.commit()
        
        flash(f'Registration successful as {username}! Please log in.', 'success')
        return redirect(url_for('login'))
    
    return render_template('register.html')

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        login_input = request.form.get('email')  # This can be either email or username
        password = request.form.get('password')
        
        # Try to find user by email or username
        user = User.query.filter(
            db.or_(
                User.email == login_input,
                User.username == login_input
            )
        ).first()
        
        if user and user.check_password(password):
            streak = update_streak(user)
            login_user(user)
            verify_user_sticker_integrity(user)
            check_achievements(user, 'streak', streak)
            if user.current_streak in [7, 30, 100, 365]:
                pack_type = 'legendary' if user.current_streak == 365 else ('premium' if user.current_streak >= 30 else 'standard')
                db.session.add(StickerPack(
                    user_id=user.id,
                    pack_type=pack_type,
                    source='streak_milestone',
                    source_detail=f'{user.current_streak}-day streak'
                ))
                session['pending_pack_notification'] = f'🎁 {user.current_streak}-day streak reward: {pack_type.title()} sticker pack!'
                db.session.commit()
            
            # Store username in session for multiplayer
            session['username'] = user.username
            session['user_id'] = user.id
            
            if streak > 1:
                flash(f'🔥 {streak}-Day Login Streak! Keep it going!', 'success')
                user.add_character_interaction('GIGA', 'streak_login', {'streak': streak})
                message = get_giga_message(user, 'login')
                log_character_interaction(user.id, 'GIGA', 'login', message, 'login')
            else:
                user.add_character_interaction('GIGA', 'login')
                message = get_giga_message(user, 'first_login' if streak == 1 else 'login')
                log_character_interaction(user.id, 'GIGA', 'login', message, 'login')

            next_page = request.args.get('next')
            flash(f'Welcome back, {user.username}! Login successful!', 'success')
            return redirect(next_page or url_for('dashboard'))
        else:
            flash('Invalid username/email or password!', 'danger')
    
    return render_template('login.html')
@app.route('/logout', methods=['GET', 'POST'])
@login_required
def logout():
    logout_user()
    flash('You have been logged out.', 'info')
    return redirect(url_for('index'))

@app.route('/dashboard')
@login_required
def dashboard():
    old_level = current_user.level
    level_up = current_user.update_level()
    
    # Check for milestone level up
    if level_up:
        db.session.commit()
        check_achievements(current_user, 'level', current_user.level)
        current_user.add_character_interaction('GIGA', 'level_up', {'level': current_user.level})
        message = get_giga_message(current_user, 'level_up')
        log_character_interaction(current_user.id, 'GIGA', 'level_up', message, 'level_up')
        
        # Special milestone celebration
        if current_user.level % 10 == 0:
            milestone_reward = current_user.get_milestone_reward(current_user.level)
            current_user.geek_balance += milestone_reward.get('geek', 0)
            current_user.xp += milestone_reward.get('xp', 0)
            
            stage = get_level_stage(current_user.level)
            flash(f'🎉🎉🎉 MAJOR MILESTONE! Level {current_user.level} - {stage["tag"]}! 🎉🎉🎉', 'success')
            flash(f'🏆 Milestone Reward: +{milestone_reward.get("geek", 0)} GEEK, +{milestone_reward.get("xp", 0)} XP!', 'success')
            
            packs_earned = 3
            pack_type = 'legendary' if current_user.level == 100 else 'premium'
            for _ in range(packs_earned):
                db.session.add(StickerPack(
                    user_id=current_user.id,
                    pack_type=pack_type,
                    source='level_up',
                    source_detail=f'Reached Level {current_user.level}'
                ))
            session['pending_pack_notification'] = f'🎁 Level milestone reward: {packs_earned} {pack_type} sticker packs!'
            
            db.session.commit()
        else:
            db.session.add(StickerPack(
                user_id=current_user.id,
                pack_type='standard',
                source='level_up',
                source_detail=f'Reached Level {current_user.level}'
            ))
            session['pending_pack_notification'] = '🎁 Level up reward: 1 standard sticker pack!'
            db.session.commit()
            flash(f'🎉 Level Up! You are now Level {current_user.level}!', 'success')

    # Get current level stage
    current_stage = get_level_stage(current_user.level)
    
    cce_stats = {
        'total_earned': current_user.total_earned_geek,
        'questions_submitted': current_user.questions_submitted,
        'questions_approved': current_user.questions_approved,
        'reviews_completed': current_user.reviews_completed,
        'review_accuracy': current_user.review_accuracy,
        'reputation_score': current_user.reputation_score
    }
    
    recent_earnings = CreatorEarning.query.filter_by(creator_id=current_user.id)\
        .order_by(CreatorEarning.timestamp.desc()).limit(10).all()
    
    questions_nearing_cap = Question.query.filter_by(
        created_by=current_user.id,
        status='approved'
    ).filter(
        Question.total_earned >= CCE_MAX_EARNINGS_PER_QUESTION * 0.8
    ).all()
    
    achievements_count = UserAchievement.query.filter_by(user_id=current_user.id).count()
    stickers_count = db.session.query(
        db.func.count(db.distinct(UserSticker.sticker_id))
    ).filter(
        UserSticker.user_id == current_user.id,
        UserSticker.is_duplicate == False
    ).scalar() or 0
    recent_owned_stickers = db.session.query(
        Sticker.id,
        Sticker.name,
        Sticker.number,
        Sticker.rarity,
        db.func.max(UserSticker.date_acquired).label('last_acquired')
    ).join(
        UserSticker, UserSticker.sticker_id == Sticker.id
    ).filter(
        UserSticker.user_id == current_user.id,
        UserSticker.is_duplicate == False
    ).group_by(
        Sticker.id, Sticker.name, Sticker.number, Sticker.rarity
    ).order_by(
        db.func.max(UserSticker.date_acquired).desc()
    ).limit(8).all()
    dashboard_stickers = [
        {
            'owned': True,
            'name': sticker.name,
            'emoji': get_sticker_emoji(sticker.name, sticker.number, sticker.rarity),
            'number': sticker.number
        }
        for sticker in recent_owned_stickers
    ]
    while len(dashboard_stickers) < 8:
        dashboard_stickers.append({'owned': False})
    submitted_questions = Question.query.filter_by(created_by=current_user.id).count()
    approved_questions = Question.query.filter_by(created_by=current_user.id, status='approved').count()
    validation_count = QuestionValidation.query.filter_by(validator_id=current_user.id).count() if current_user.role in ['validator', 'admin'] else 0
    
    xp_progress = current_user.get_xp_progress()
    milestone_progress = current_user.get_milestone_progress()
    next_milestone = current_user.get_next_milestone()
    xp_to_milestone = current_user.get_xp_for_next_milestone()
    
    creator_earnings = db.session.query(db.func.sum(CreatorEarning.amount)).filter_by(creator_id=current_user.id).scalar() or 0
    latest_run = GauntletRun.query.filter_by(
        user_id=current_user.id,
        completed=True
    ).order_by(GauntletRun.date_completed.desc()).first()
    
    active_run = GauntletRun.query.filter_by(user_id=current_user.id, completed=False).first()
    
    recent_interactions = CharacterInteraction.query.filter_by(user_id=current_user.id)\
        .order_by(CharacterInteraction.timestamp.desc()).limit(5).all()
    
    ai_recommendation = generate_ai_recommendation(current_user)
    
    character_to_show = get_character_for_context('dashboard')
    character_message = None
    if character_to_show == 'GIGA':
        character_message = ai_recommendation['message'] if ai_recommendation['type'] != 'general' else get_giga_message(current_user, 'dashboard')
        current_user.add_character_interaction('GIGA', 'dashboard_view')
    else:
        character_message = get_ace_message(current_user, 'dashboard')
        current_user.add_character_interaction('ACE', 'dashboard_view')
    
    weak_topics = current_user.get_weak_topics(threshold=60)
    weak_cats_info = []
    for weak in weak_topics[:3]:
        cat = Topic.query.get(weak['topic_id'])
        if cat:
            weak_cats_info.append({
                'name': cat.name,
                'accuracy': weak['accuracy']
            })
    
    word_challenge_stats = {
        'wins': current_user.word_challenge_wins,
        'losses': current_user.word_challenge_losses,
        'draws': current_user.word_challenge_draws,
        'high_score': current_user.word_challenge_high_score,
        'bingos': current_user.word_challenge_bingos,
        'longest_word': current_user.word_challenge_longest_word
    }
    
    active_word_challenges = WordChallenge.query.join(WordChallengePlayer).filter(
        WordChallengePlayer.user_id == current_user.id,
        WordChallenge.status == 'in_progress'
    ).count()
    unopened_packs = StickerPack.query.filter_by(user_id=current_user.id, is_opened=False).count()
    total_questions_approved = Question.query.filter_by(status='approved').count()
    user_count = User.query.count()
    
    # Get exchange rate for display
    exchange_rate = KaspaPrice.get_rate()
    
    # Check for pending Kaspa payments
    pending_payments_count = KaspaPayment.query.filter_by(
        user_id=current_user.id,
        status='pending'
    ).count()
    
    db.session.commit()
    
    return render_template('dashboard.html',
                         user=current_user,
                         achievements_count=achievements_count,
                         stickers_count=stickers_count,
                         dashboard_stickers=dashboard_stickers,
                         streak_multiplier=get_streak_multiplier(current_user.current_streak),
                         submitted_questions=submitted_questions,
                         approved_questions=approved_questions,
                         validation_count=validation_count,
                         xp_progress=xp_progress,
                         milestone_progress=milestone_progress,
                         next_milestone=next_milestone,
                         xp_to_milestone=xp_to_milestone,
                         creator_earnings=creator_earnings,
                         latest_run=latest_run,
                         cce_stats=cce_stats,
                         recent_earnings=recent_earnings,
                         questions_nearing_cap=questions_nearing_cap,
                         recent_interactions=recent_interactions,
                         character_to_show=character_to_show,
                         character_message=character_message,
                         ai_recommendation=ai_recommendation,
                         weak_topics=weak_cats_info,
                         word_challenge_stats=word_challenge_stats,
                         active_word_challenges=active_word_challenges,
                         unopened_packs=unopened_packs,
                         total_questions_approved=total_questions_approved,
                         user_count=user_count,
                         level_stage=current_stage,
                         exchange_rate=exchange_rate,
                         pending_payments_count=pending_payments_count,
                         active_run=active_run,
                         achievements_total=len(ACHIEVEMENTS))

@app.route('/profile')
@login_required
def profile():
    """Profile alias route to avoid broken navigation links."""
    return redirect(url_for('dashboard'))

@app.route('/api/leaderboard')
@login_required
def api_leaderboard():
    top_users = User.query.order_by(User.points.desc(), User.geek_balance.desc(), User.level.desc()).limit(10).all()
    leaderboard = []
    for idx, u in enumerate(top_users, start=1):
        leaderboard.append({
            'rank': idx,
            'name': u.username if u.username else (u.email.split('@')[0]),
            'points': u.points or 0,
            'level': u.level or 1,
            'geek_balance': round(u.geek_balance or 0.0, 2),
            'is_current_user': (u.id == current_user.id)
        })
    return jsonify({'success': True, 'leaderboard': leaderboard})

# ==================== KASPA PAYMENT ROUTES (Testnet-10 Real Integration) ====================

@app.route('/kaspa/buy_geek')
@login_required
def kaspa_buy_geek():
    """Page to buy GEEK tokens with Kaspa (testnet-10)"""
    exchange_rate = KaspaPrice.get_rate()

    # Exclude placeholder-only pending payments (no real txid yet) for the status display
    pending_payments = KaspaPayment.query.filter_by(
        user_id=current_user.id,
        status='pending'
    ).order_by(KaspaPayment.created_at.desc()).all()

    payment_history = KaspaPayment.query.filter_by(
        user_id=current_user.id,
        status='confirmed'
    ).order_by(KaspaPayment.created_at.desc()).limit(10).all()

    current_geek = current_user.geek_balance

    return render_template('kaspa_buy_geek.html',
                           exchange_rate=exchange_rate,
                           pending_payments=pending_payments,
                           payment_history=payment_history,
                           current_geek=current_geek)


@app.route('/kaspa/create_payment', methods=['POST'])
@login_required
def kaspa_create_payment():
    """Create a real Kaspa testnet-10 payment request via KaspaPaymentSession."""
    import kaspaintegration

    try:
        geek_amount = float(request.form.get('geek_amount', 0))
        if geek_amount <= 0:
            # Fallback: accept kaspa_amount and convert
            kaspa_amount = float(request.form.get('kaspa_amount', 0))
            if kaspa_amount < 1:
                return jsonify({'success': False, 'message': 'Minimum purchase is 1 KAS'})
            exchange_rate = KaspaPrice.get_rate()
            geek_amount = kaspa_amount * exchange_rate

        session_mgr = kaspaintegration.KaspaPaymentSession()
        payment_details = session_mgr.create_payment_request(
            user_id=current_user.id,
            geek_amount=geek_amount,
            app=app,
            purpose='buy_geek',
        )

        return jsonify({
            'success': True,
            'payment_reference': payment_details['payment_reference'],
            'kaspa_address': payment_details['kaspa_address'],
            'kas_amount': payment_details['kas_amount'],
            'sompi_amount': payment_details['sompi_amount'],
            'geek_amount': payment_details['geek_amount'],
            'expires_at': payment_details['expires_at'],
            'exchange_rate': payment_details['exchange_rate'],
        })

    except kaspaintegration.KaspaAPIUnavailableError as e:
        return jsonify({'success': False, 'message': str(e)})
    except Exception as e:
        app.logger.error('Error creating Kaspa payment: %s', e, exc_info=True)
        return jsonify({'success': False, 'message': 'Failed to create payment request. Please try again.'})


@app.route('/kaspa/submit_txid', methods=['POST'])
@login_required
def kaspa_submit_txid():
    """
    Accept the user's real Kaspa transaction ID after they have sent KAS.
    Stores the txid on the pending KaspaPayment record so the polling thread
    (or manual check) can verify it on-chain.
    """
    data = request.get_json(silent=True) or request.form
    payment_reference = data.get('payment_reference', '').strip()
    transaction_id = data.get('transaction_id', '').strip()

    if not payment_reference or not transaction_id:
        return jsonify({'success': False, 'message': 'payment_reference and transaction_id are required.'})

    # Basic Kaspa txid sanity check (should be a 64-char hex string)
    if len(transaction_id) != 64 or not all(c in '0123456789abcdefABCDEF' for c in transaction_id):
        return jsonify({
            'success': False,
            'message': 'Invalid transaction ID format. Kaspa transaction IDs are 64 hexadecimal characters.'
        })

    payment = KaspaPayment.query.filter_by(
        payment_reference=payment_reference,
        user_id=current_user.id,
    ).first()

    if not payment:
        return jsonify({'success': False, 'message': 'Payment reference not found.'})

    if payment.status == 'confirmed':
        return jsonify({'success': True, 'message': 'This payment is already confirmed.', 'status': 'confirmed'})

    if payment.status == 'expired':
        return jsonify({'success': False, 'message': 'This payment request has expired. Please create a new one.'})

    # Check for duplicate txid usage: reject if another payment already used this txid
    existing = KaspaPayment.query.filter(
        KaspaPayment.transaction_id == transaction_id,
        KaspaPayment.id != payment.id
    ).first()
    if existing:
        return jsonify({
            'success': False,
            'message': 'This transaction ID is already registered with another payment.'
        })

    # Store the real txid (replaces PENDING- placeholder)
    payment.transaction_id = transaction_id
    db.session.commit()

    # Trigger an immediate verification attempt (non-blocking)
    import kaspaintegration, threading
    def _try_verify():
        try:
            session_mgr = kaspaintegration.KaspaPaymentSession()
            session_mgr.verify_and_credit(
                txid=transaction_id,
                payment_reference=payment_reference,
                app=app,
            )
        except Exception as ex:
            app.logger.error('Immediate verify error for %s: %s', payment_reference, ex)

    threading.Thread(target=_try_verify, daemon=True).start()

    return jsonify({
        'success': True,
        'message': 'Transaction ID received. Verifying on-chain now — this may take a minute.',
        'payment_reference': payment_reference,
    })


@app.route('/kaspa/check_payment/<payment_reference>')
@login_required
def kaspa_check_payment(payment_reference):
    """
    Return real on-chain confirmation status for the given payment_reference.
    The frontend polls this every 15 seconds.
    No simulation, no random — reads the actual KaspaPayment DB record.
    """
    payment = KaspaPayment.query.filter_by(payment_reference=payment_reference).first()

    if not payment:
        # Fallback: legacy lookup by transaction_id for old records
        payment = KaspaPayment.query.filter_by(transaction_id=payment_reference).first()

    if not payment:
        return jsonify({'success': False, 'message': 'Payment not found'})

    if payment.user_id != current_user.id and not current_user.is_admin:
        return jsonify({'success': False, 'message': 'Access denied'})

    # If a real txid is set and status is still pending, trigger a live check
    if payment.status == 'pending' and not payment.transaction_id.startswith('PENDING-'):
        import kaspaintegration
        try:
            session_mgr = kaspaintegration.KaspaPaymentSession()
            session_mgr.verify_and_credit(
                txid=payment.transaction_id,
                payment_reference=payment.payment_reference or payment.transaction_id,
                app=app,
            )
        except kaspaintegration.KaspaAPIUnavailableError:
            pass  # Return current DB status; retry on next poll
        except Exception as e:
            app.logger.warning('Error in live check for %s: %s', payment_reference, e)

    # Re-query to get the latest state after potential verify_and_credit update
    db.session.refresh(payment)

    return jsonify({
        'success': True,
        'payment': payment.to_dict(),
        'confirmed': payment.status == 'confirmed',
    })


@app.route('/kaspa/gauntlet_continue', methods=['POST'])
@login_required
def kaspa_gauntlet_continue():
    """
    Create a real Kaspa testnet-10 payment request for Gauntlet entry fee.
    Does NOT grant access or credit GEEK until the payment is verified on-chain.
    The frontend must poll kaspa_check_payment until confirmed,
    then redirect to gauntlet_start_round.
    """
    import kaspaintegration

    data = request.get_json(silent=True) or {}
    round_number = data.get('round_number')
    entry_fee = data.get('entry_fee')

    if not round_number or entry_fee is None:
        return jsonify({'success': False, 'message': 'Missing round information'})

    try:
        entry_fee = float(entry_fee)
        session_mgr = kaspaintegration.KaspaPaymentSession()
        payment_details = session_mgr.create_payment_request(
            user_id=current_user.id,
            geek_amount=entry_fee,
            app=app,
            purpose='gauntlet_entry',
            round_number=round_number,
        )

        return jsonify({
            'success': True,
            'payment_reference': payment_details['payment_reference'],
            'kaspa_address': payment_details['kaspa_address'],
            'kas_amount': payment_details['kas_amount'],
            'sompi_amount': payment_details['sompi_amount'],
            'geek_amount': payment_details['geek_amount'],
            'expires_at': payment_details['expires_at'],
            'exchange_rate': payment_details['exchange_rate'],
            'round_number': round_number,
            'message': 'Send the exact KAS amount to the address below, then submit your transaction ID.',
        })

    except kaspaintegration.KaspaAPIUnavailableError as e:
        return jsonify({'success': False, 'message': str(e)})
    except Exception as e:
        app.logger.error('Error creating Gauntlet Kaspa payment: %s', e, exc_info=True)
        return jsonify({'success': False, 'message': 'Failed to create payment request. Please try again.'})

@app.route('/connect_wallet', methods=['POST'])
@login_required
def connect_wallet():
    wallet_address = request.form.get('wallet_address')
    current_user.wallet_address = wallet_address
    db.session.commit()
    flash('Wallet connected successfully!', 'success')
    return redirect(url_for('dashboard'))

@app.route('/cce_dashboard')
@login_required
def cce_dashboard():
    if current_user.level < CCE_MIN_LEVEL_FOR_CREATION:
        flash(f'You must reach Level {CCE_MIN_LEVEL_FOR_CREATION} to access CCE features!', 'warning')
        return redirect(url_for('dashboard'))
    creator_stats = {
        'total_submitted': current_user.questions_submitted,
        'total_approved': current_user.questions_approved,
        'total_rejected': current_user.reviews_completed,
        'approval_rate': round((current_user.questions_approved / current_user.questions_submitted * 100) if current_user.questions_submitted > 0 else 0, 1),
        'total_earned': current_user.total_earned_geek,
        'reputation': current_user.reputation_score
    }
    reviewer_stats = {
        'total_reviews': current_user.reviews_completed,
        'review_accuracy': current_user.review_accuracy,
        'total_review_earnings': current_user.reviews_completed * CCE_REVIEW_REWARD_GEEK
    }
    recent_submissions = Question.query.filter_by(created_by=current_user.id)\
        .order_by(Question.date_created.desc()).limit(5).all()
    recent_reviews = QuestionValidation.query.filter_by(validator_id=current_user.id)\
        .order_by(QuestionValidation.timestamp.desc()).limit(5).all()
    top_questions = Question.query.filter_by(created_by=current_user.id, status='approved')\
        .order_by(Question.total_earned.desc()).limit(5).all()
    if current_user.level >= CCE_MIN_LEVEL_FOR_REVIEW:
        next_review = get_next_review_for_user(current_user.id)
    else:
        next_review = None
    return render_template('cce_dashboard.html',
                         creator_stats=creator_stats,
                         reviewer_stats=reviewer_stats,
                         recent_submissions=recent_submissions,
                         recent_reviews=recent_reviews,
                         top_questions=top_questions,
                         next_review=next_review)

@app.route('/cce/submit_question', methods=['GET', 'POST'])
@login_required
def cce_submit_question():
    if current_user.level < CCE_MIN_LEVEL_FOR_CREATION:
        flash(f'You must be at least Level {CCE_MIN_LEVEL_FOR_CREATION} to submit questions!', 'danger')
        return redirect(url_for('dashboard'))
    if request.method == 'POST':
        required_fields = ['question', 'option1', 'option2', 'option3', 'option4',
                          'correct_option', 'difficulty', 'topic_id', 'source_link']
        for field in required_fields:
            if not request.form.get(field):
                flash(f'Please fill in all required fields! Missing: {field}', 'danger')
                return redirect(url_for('cce_submit_question'))
        question_text = request.form.get('question')
        option1 = request.form.get('option1')
        option2 = request.form.get('option2')
        option3 = request.form.get('option3')
        option4 = request.form.get('option4')
        correct_option = int(request.form.get('correct_option'))
        difficulty = request.form.get('difficulty', 'easy')
        topic_id = int(request.form.get('topic_id'))
        source_link = request.form.get('source_link', '')
        subtopic = request.form.get('subtopic', '')
        fun_fact = request.form.get('fun_fact', '')
        
        if correct_option not in [1, 2, 3, 4]:
            flash('Correct option must be between 1 and 4!', 'danger')
            return redirect(url_for('cce_submit_question'))
        existing = Question.query.filter_by(question=question_text).first()
        if existing:
            flash('This question already exists! Please submit a different question.', 'warning')
            return redirect(url_for('cce_submit_question'))
        question = Question(
            question=question_text,
            option1=option1,
            option2=option2,
            option3=option3,
            option4=option4,
            correct_option=correct_option,
            difficulty=difficulty,
            topic_id=topic_id,
            created_by=current_user.id,
            source_link=source_link,
            subtopic=subtopic if subtopic else None,
            fun_fact=fun_fact if fun_fact else None,
            status='pending'
        )
        db.session.add(question)
        current_user.questions_submitted += 1
        add_to_review_queue(question.id)
        db.session.commit()
        total_submitted = Question.query.filter_by(created_by=current_user.id).count()
        check_achievements(current_user, 'questions_submitted', total_submitted)
        
        current_user.add_character_interaction('GIGA', 'question_submitted', {'question_id': question.id})
        message = get_giga_message(current_user, 'achievement')
        log_character_interaction(current_user.id, 'GIGA', 'question_submission', message, 'achievement')
        
        flash('✅ Question submitted for peer review! It needs 5 approvals to become active.', 'success')
        return redirect(url_for('cce_dashboard'))
    topics = Topic.query.filter_by(is_active=True).all()
    return render_template('cce_submit_question.html',
                         topics=topics,
                         min_level=CCE_MIN_LEVEL_FOR_CREATION)

@app.route('/cce/review_queue')
@login_required
def cce_review_queue():
    if current_user.level < CCE_MIN_LEVEL_FOR_REVIEW:
        flash(f'You must be at least Level {CCE_MIN_LEVEL_FOR_REVIEW} to review questions!', 'danger')
        return redirect(url_for('dashboard'))
    question = get_next_review_for_user(current_user.id)
    if not question:
        return render_template('cce_no_reviews.html')
    topic_name = question.topic.name if question.topic else "Unknown"
    creator = User.query.get(question.created_by)
    creator_display = f"Level {creator.level} Creator" if creator else "Unknown Creator"
    session['review_start_time'] = time.time()
    session['current_review_question_id'] = question.id
    return render_template('cce_review_question.html',
                         question=question,
                         topic_name=topic_name,
                         creator_display=creator_display,
                         approvals_needed=CCE_APPROVALS_NEEDED)

@app.route('/cce/submit_review/<int:question_id>', methods=['POST'])
@login_required
def cce_submit_review(question_id):
    if current_user.level < CCE_MIN_LEVEL_FOR_REVIEW:
        return jsonify({'success': False, 'message': f'Level {CCE_MIN_LEVEL_FOR_REVIEW} required!'})
    existing = QuestionValidation.query.filter_by(
        question_id=question_id,
        validator_id=current_user.id
    ).first()
    if existing:
        return jsonify({'success': False, 'message': 'You have already reviewed this question!'})
    action = request.form.get('action')
    detailed_feedback = request.form.get('detailed_feedback', '').strip()
    if action not in ['approved', 'rejected']:
        return jsonify({'success': False, 'message': 'Invalid action!'})
    review_time = 0.0
    if 'review_start_time' in session:
        review_time = time.time() - session['review_start_time']
        session.pop('review_start_time', None)
    points, geek = award_validation_points(current_user.id, question_id, action, review_time, detailed_feedback)
    question = Question.query.get(question_id)
    if question:
        question.total_reviews += 1
        if action == 'approved':
            question.approvals_count += 1
        else:
            question.rejections_count += 1
        question_approved = check_question_approval_status(question_id)
        
        current_user.add_character_interaction('ACE', 'review_submitted', {
            'question_id': question_id,
            'action': action,
            'review_time': review_time
        })
        message = get_ace_message(current_user, 'review_submission')
        log_character_interaction(current_user.id, 'ACE', 'review_submission', message, 'assessment')
        
        if question_approved:
            db.session.commit()
            return jsonify({
                'success': True,
                'message': f'Review submitted! You earned {points} points and {geek} GEEK. This question has been APPROVED and is now active!',
                'question_approved': True,
                'points': points,
                'geek': geek
            })
        else:
            db.session.commit()
            remaining = CCE_APPROVALS_NEEDED - question.approvals_count
            return jsonify({
                'success': True,
                'message': f'Review submitted! You earned {points} points and {geek} GEEK. This question needs {remaining} more approval(s).',
                'question_approved': False,
                'points': points,
                'geek': geek,
                'remaining_approvals': remaining
            })
    return jsonify({'success': False, 'message': 'Question not found!'})

@app.route('/cce/my_questions')
@login_required
def cce_my_questions():
    if current_user.level < CCE_MIN_LEVEL_FOR_CREATION:
        flash(f'Level {CCE_MIN_LEVEL_FOR_CREATION} required to view CCE questions!', 'warning')
        return redirect(url_for('dashboard'))
    user_questions = Question.query.filter_by(created_by=current_user.id)\
        .join(Topic)\
        .add_columns(Topic.name)\
        .order_by(Question.date_created.desc()).all()
    questions_with_stats = []
    for question, topic_name in user_questions:
        earnings_percentage = (question.total_earned / CCE_MAX_EARNINGS_PER_QUESTION) * 100 if CCE_MAX_EARNINGS_PER_QUESTION > 0 else 0
        if question.status == 'pending':
            status_text = f"Pending ({question.approvals_count}/{CCE_APPROVALS_NEEDED} approvals)"
        elif question.status == 'approved':
            status_text = f"Active ({question.total_serves} serves, {question.total_earned:.1f} GEEK earned)"
        else:
            status_text = "Rejected"
        questions_with_stats.append({
            'question': question,
            'topic_name': topic_name,
            'earnings_percentage': earnings_percentage,
            'status_text': status_text,
            'days_since_submission': (datetime.datetime.utcnow() - question.date_created).days
        })
    return render_template('cce_my_questions.html',
                         questions=questions_with_stats)

@app.route('/cce/question_analytics/<int:question_id>')
@login_required
def cce_question_analytics(question_id):
    question = Question.query.get_or_404(question_id)
    if question.created_by != current_user.id and not current_user.is_admin:
        flash('Access denied! You can only view analytics for your own questions.', 'danger')
        return redirect(url_for('cce_my_questions'))
    earnings_history = CreatorEarning.query.filter_by(question_id=question_id)\
        .order_by(CreatorEarning.timestamp.desc()).limit(50).all()
    thirty_days_ago = datetime.datetime.utcnow() - datetime.timedelta(days=30)
    daily_earnings = db.session.query(
        db.func.date(CreatorEarning.timestamp),
        db.func.sum(CreatorEarning.amount)
    ).filter(
        CreatorEarning.question_id == question_id,
        CreatorEarning.timestamp >= thirty_days_ago
    ).group_by(db.func.date(CreatorEarning.timestamp)).all()
    attempts = Attempt.query.filter_by(question_id=question_id).all()
    correct_attempts = [a for a in attempts if a.is_correct]
    accuracy = len(correct_attempts) / len(attempts) * 100 if attempts else 0
    reviews = QuestionValidation.query.filter_by(question_id=question_id).all()
    return render_template('cce_question_analytics.html',
                         question=question,
                         earnings_history=earnings_history,
                         daily_earnings=daily_earnings,
                         attempts=attempts,
                         accuracy=accuracy,
                         reviews=reviews)

@app.route('/cce/leaderboard')
@login_required
def cce_leaderboard():
    top_creators = User.query.filter(User.total_earned_geek > 0)\
        .order_by(User.total_earned_geek.desc()).limit(20).all()
    top_reviewers = User.query.filter(User.reviews_completed >= 10)\
        .order_by(User.review_accuracy.desc()).limit(20).all()
    popular_questions = Question.query.filter_by(status='approved')\
        .order_by(Question.total_serves.desc()).limit(10).all()
    return render_template('cce_leaderboard.html',
                         top_creators=top_creators,
                         top_reviewers=top_reviewers,
                         popular_questions=popular_questions)


GAUNTLET_PERSIST_KEYS = [
    'gauntlet_run_id', 'selected_topics',
    'current_round', 'round_geek_earned', 'round_correct_answers',
    'round_questions_answered', 'round_questions', 'current_question_index',
    'current_question_id', 'round_session_id', 'round_score',
    'gauntlet_total_correct', 'gauntlet_total_questions', 'gauntlet_total_score',
    'gauntlet_total_geek_earned', 'gauntlet_session_balance', 'question_option_map',
    'answered_question_ids', 'combo_count', 'is_recycled', 'season_number', 'season_year',
    'round_modifier', 'round_entry_fee_charged', 'round_total_reward_target', 'safety_net_fee',
    'hot_streak_active', 'hot_streak_opening_correct', 'hint_tokens_remaining',
    'live_event', 'live_event_data', 'live_event_used', 'live_event_question',
    'last_event_question', 'live_event_active', 'event_multiplier',
    'event_multiplier_questions', 'hot_topic_name', 'hot_topic_questions',
    'round_live_events', 'actual_questions_in_round'
]


def _active_gauntlet_run_for_user(user_id):
    return GauntletRun.query.filter_by(user_id=user_id, completed=False).first()


def persist_gauntlet_progress(active_run=None):
    """Persist in-flight gauntlet state to DB so progress survives logout/session loss."""
    if not current_user.is_authenticated:
        return False

    run = active_run or _active_gauntlet_run_for_user(current_user.id)
    if not run:
        return False

    snapshot = {}
    for key in GAUNTLET_PERSIST_KEYS:
        if key in session:
            val = session.get(key)
            if isinstance(val, (str, int, float, bool, list, dict, type(None))):
                snapshot[key] = val

    current_round = session.get('current_round')
    if isinstance(current_round, int):
        run.active_round = current_round
    elif isinstance(current_round, str) and current_round.isdigit():
        run.active_round = int(current_round)
    else:
        run.active_round = run.highest_round + 1 if run.highest_round else 1

    run.active_state = json.dumps(snapshot)
    run.active_state_updated_at = datetime.datetime.utcnow()
    try:
        db.session.commit()
        return True
    except Exception as e:
        db.session.rollback()
        print(f"Error persisting gauntlet progress: {e}")
        return False


def restore_gauntlet_progress(active_run):
    """Restore persisted gauntlet state into flask session for seamless resume."""
    if not active_run or not active_run.active_state:
        return False

    try:
        snapshot = json.loads(active_run.active_state)
    except (TypeError, ValueError, json.JSONDecodeError) as e:
        print(f"Error decoding gauntlet state: {e}")
        return False

    if not isinstance(snapshot, dict):
        return False

    for key in GAUNTLET_PERSIST_KEYS:
        if key in snapshot:
            session[key] = snapshot[key]
    
    # Validate restored questions still exist
    round_questions = session.get('round_questions', [])
    if round_questions:
        valid_questions = []
        for qid in round_questions:
            if Question.query.get(qid):
                valid_questions.append(qid)
        if len(valid_questions) != len(round_questions):
            session['round_questions'] = valid_questions
            if session.get('current_question_index', 0) >= len(valid_questions):
                session['current_question_index'] = max(0, len(valid_questions) - 1)
    
    return True


def get_gauntlet_state_age(active_run):
    """Get age of saved state in hours."""
    if not active_run or not active_run.active_state_updated_at:
        return None
    delta = datetime.datetime.utcnow() - active_run.active_state_updated_at
    return delta.total_seconds() / 3600


def is_gauntlet_state_stale(active_run, hours=168):
    """Check if saved state is older than specified hours (default 7 days)."""
    age = get_gauntlet_state_age(active_run)
    return age is not None and age > hours


def get_gauntlet_resume_info(active_run):
    """Get resume information for UI display."""
    if not active_run:
        return None
    
    try:
        snapshot = json.loads(active_run.active_state) if active_run.active_state else {}
    except (TypeError, ValueError, json.JSONDecodeError):
        snapshot = {}
    
    current_round = snapshot.get('current_round', active_run.active_round or 1)
    question_index = snapshot.get('current_question_index', 0)
    round_questions = snapshot.get('round_questions', [])
    total_questions = len(round_questions) if round_questions else 0
    current_score = snapshot.get('gauntlet_total_score', 0)
    total_geek = snapshot.get('gauntlet_total_geek_earned', 0)
    
    age_hours = get_gauntlet_state_age(active_run)
    age_display = None
    if age_hours is not None:
        if age_hours < 1:
            age_display = f"{int(age_hours * 60)} minutes ago"
        elif age_hours < 24:
            age_display = f"{int(age_hours)} hours ago"
        else:
            age_display = f"{int(age_hours / 24)} days ago"
    
    return {
        'round': current_round,
        'question': question_index + 1,
        'total_questions': total_questions,
        'score': current_score,
        'geek_earned': total_geek,
        'saved_at': active_run.active_state_updated_at,
        'age_display': age_display,
        'is_stale': is_gauntlet_state_stale(active_run, 168)
    }


def clear_persisted_gauntlet_progress(active_run):
    if not active_run:
        return
    active_run.active_round = None
    active_run.active_state = None
    active_run.active_state_updated_at = None


def get_gauntlet_resume_round(active_run):
    if not active_run:
        return 1
    if isinstance(active_run.active_round, int) and 1 <= active_run.active_round <= len(GAUNTLET_ROUNDS):
        return active_run.active_round
    fallback = (active_run.highest_round or 0) + 1
    return max(1, min(fallback, len(GAUNTLET_ROUNDS)))

@app.route('/geek_gauntlet')
@login_required
def geek_gauntlet():
    active_run = GauntletRun.query.filter_by(user_id=current_user.id, completed=False).first()
    if active_run:
        resume_info = get_gauntlet_resume_info(active_run)
        if resume_info and resume_info['is_stale']:
            flash(f"Your saved game is {resume_info['age_display']} old. You can continue or start fresh.", 'warning')
        resume_round = get_gauntlet_resume_round(active_run)
        restored = restore_gauntlet_progress(active_run)
        round_questions = session.get('round_questions') or []
        question_index = session.get('current_question_index', 0)
        if isinstance(round_questions, list) and len(round_questions) > 0 and question_index < len(round_questions):
            if restored:
                flash('Resumed your saved gauntlet round.', 'info')
            return redirect(url_for('gauntlet_question'))
        if restored and session.get('current_round'):
            try:
                return redirect(url_for('gauntlet_pre_round', round_number=int(session.get('current_round'))))
            except (TypeError, ValueError):
                pass
        return redirect(url_for('gauntlet_pre_round', round_number=resume_round))
    topics = Topic.query.filter_by(is_active=True).all()
    selected_topics = get_user_topics_preferences(current_user.id)
    return render_template('geek_gauntlet.html',
                         user=current_user,
                         topics=topics,
                         selected_topics=selected_topics,
                         GAUNTLET_ROUNDS=GAUNTLET_ROUNDS)

@app.route('/update_topics_preferences', methods=['POST'])
@login_required
def update_topics_preferences():
    selected_topics = request.form.getlist('topics[]')
    if len(selected_topics) < 2:
        flash('Please select at least 2 topics!', 'danger')
        return redirect(url_for('geek_gauntlet'))
    try:
        selected_topics = [int(cat_id) for cat_id in selected_topics]
    except ValueError:
        flash('Invalid topic selection!', 'danger')
        return redirect(url_for('geek_gauntlet'))
    session['selected_topics'] = selected_topics
    flash('Topic preferences updated!', 'success')
    return redirect(url_for('geek_gauntlet'))

@app.route('/gauntlet_start', methods=['POST'])
@login_required
def gauntlet_start():
    selected_topics = request.form.getlist('topics[]')
    if len(selected_topics) < 2:
        flash('Please select at least 2 topics!', 'danger')
        return redirect(url_for('geek_gauntlet'))
    try:
        selected_topics = [int(cat_id) for cat_id in selected_topics]
    except ValueError:
        flash('Invalid topic selection!', 'danger')
        return redirect(url_for('geek_gauntlet'))
    active_run = GauntletRun.query.filter_by(user_id=current_user.id, completed=False).first()
    if active_run:
        resume_round = get_gauntlet_resume_round(active_run)
        restore_gauntlet_progress(active_run)
        round_questions = session.get('round_questions') or []
        question_index = session.get('current_question_index', 0)
        if isinstance(round_questions, list) and len(round_questions) > 0 and question_index < len(round_questions):
            flash('Resuming your active round.', 'info')
            return redirect(url_for('gauntlet_question'))
        return redirect(url_for('gauntlet_pre_round', round_number=resume_round))
    active_run = GauntletRun(
        user_id=current_user.id,
        selected_topics=json.dumps(selected_topics)
    )
    db.session.add(active_run)
    db.session.commit()
    session['selected_topics'] = selected_topics
    session['gauntlet_run_id'] = active_run.id
    session['current_round'] = 1
    session['round_geek_earned'] = 0
    session['round_correct_answers'] = 0
    session['round_questions_answered'] = 0
    session['total_score'] = 0
    session['gauntlet_total_correct'] = 0
    session['gauntlet_total_questions'] = 0
    session['gauntlet_total_score'] = 0
    session['gauntlet_total_geek_earned'] = 0
    session['gauntlet_session_balance'] = float(current_user.geek_balance)
    session['question_option_map'] = {}
    session['answered_question_ids'] = []
    session['current_question_id'] = None
    session['combo_count'] = 0
    session['is_recycled'] = False
    persist_gauntlet_progress(active_run)
    return redirect(url_for('gauntlet_pre_round', round_number=1))

@app.route('/gauntlet_pre_round/<int:round_number>')
@login_required
def gauntlet_pre_round(round_number):
    if round_number < 1 or round_number > len(GAUNTLET_ROUNDS):
        flash('Invalid round number!', 'danger')
        return redirect(url_for('geek_gauntlet'))
    active_run = GauntletRun.query.filter_by(user_id=current_user.id, completed=False).first()
    if not active_run:
        flash('No active Gauntlet run found!', 'danger')
        return redirect(url_for('geek_gauntlet'))
    restore_gauntlet_progress(active_run)
    round_questions = session.get('round_questions') or []
    question_index = session.get('current_question_index', 0)
    if session.get('current_round') == round_number and isinstance(round_questions, list) and len(round_questions) > 0 and question_index < len(round_questions):
        flash('Resuming your active round.', 'info')
        return redirect(url_for('gauntlet_question'))
    round_info = GAUNTLET_ROUNDS[round_number - 1]
    session_balance = session.get('gauntlet_session_balance', current_user.geek_balance)
    can_afford = session_balance >= round_info['entry_fee']
    selected_modifier = session.get('round_modifier', 'none')
    
    exchange_rate = KaspaPrice.get_rate()
    kaspa_needed = round_info['entry_fee'] / exchange_rate
    kaspa_needed = math.ceil(kaspa_needed * 10) / 10
    
    is_milestone_round = round_number % 10 == 0
    milestone_reward = None
    if is_milestone_round:
        milestone_reward = {
            'bonus_geek': round_info['entry_fee'] * 0.5,
            'bonus_xp': 1000 * (round_number // 10),
            'sticker_pack': round_number // 10
        }

    selected_topics = []
    if active_run.selected_topics:
        try:
            selected_topics = json.loads(active_run.selected_topics)
        except:
            selected_topics = []
    topic_names = []
    for cat_id in selected_topics:
        topic = Topic.query.get(cat_id)
        if topic:
            topic_names.append(topic.name)

    historical_runs = GauntletRun.query.filter_by(user_id=current_user.id).filter(
        GauntletRun.highest_round >= round_number
    ).all()
    attempts = len(historical_runs)
    wins = sum(1 for run in historical_runs if run.completed)
    user_round_history = {
        'best_score': round(max((run.total_geek_earned for run in historical_runs), default=0), 1),
        'attempts': attempts,
        'win_rate': round((wins / attempts * 100), 1) if attempts > 0 else 0
    }

    base_confidence = 52
    if round_info.get('difficulty') in ('easy', 'easy-medium'):
        base_confidence += 18
    elif round_info.get('difficulty') in ('medium',):
        base_confidence += 8
    elif round_info.get('difficulty') in ('very-hard', 'expert'):
        base_confidence -= 14
    base_confidence += min(15, int(current_user.current_streak))
    confidence = max(5, min(95, int(base_confidence)))
    ai_character = 'GIGA' if round_number <= 5 else 'ACE'
    ai_tip = "Prioritize clean fundamentals and keep your combo protected in the first 3 questions."
    if round_info.get('difficulty') in ('hard', 'very-hard', 'expert'):
        ai_tip = "Use elimination before speed. Preserve confidence for high-variance options."
    ai_analysis = {
        'confidence': confidence,
        'tip': ai_tip,
        'message': get_giga_message(current_user, 'quiz_start') if ai_character == 'GIGA' else get_ace_message(current_user, 'quiz_start')
    }

    return render_template('gauntlet_pre_round.html',
                          round_info=round_info,
                          round_number=round_number,
                          can_afford=can_afford,
                          selected_modifier=selected_modifier,
                          total_geek=session_balance,
                          topic_names=topic_names,
                          topics_count=len(selected_topics),
                          exchange_rate=exchange_rate,
                          kaspa_needed=kaspa_needed,
                          is_milestone_round=is_milestone_round,
                          milestone_reward=milestone_reward,
                          user_round_history=user_round_history,
                          ai_analysis=ai_analysis,
                          ai_character=ai_character,
                          gauntlet_rounds_count=len(GAUNTLET_ROUNDS),
                          current_user=current_user)

@app.route('/gauntlet_start_round/<int:round_number>', methods=['GET', 'POST'])
@login_required
def gauntlet_start_round(round_number):
    if round_number < 1 or round_number > len(GAUNTLET_ROUNDS):
        flash('Invalid round number!', 'danger')
        return redirect(url_for('geek_gauntlet'))
    active_run = GauntletRun.query.filter_by(user_id=current_user.id, completed=False).first()
    if not active_run:
        flash('No active Gauntlet run found!', 'danger')
        return redirect(url_for('geek_gauntlet'))
    restore_gauntlet_progress(active_run)
    round_questions = session.get('round_questions') or []
    question_index = session.get('current_question_index', 0)
    if session.get('current_round') == round_number and isinstance(round_questions, list) and len(round_questions) > 0 and question_index < len(round_questions):
        flash('Resuming your active round.', 'info')
        return redirect(url_for('gauntlet_question'))
    round_info = GAUNTLET_ROUNDS[round_number - 1]
    requested_modifier = (request.form.get('modifier') or request.args.get('modifier') or 'none').strip().lower()
    allowed_modifiers = {'double_down', 'safety_net', 'hot_streak', 'none'}
    if requested_modifier not in allowed_modifiers:
        requested_modifier = 'none'

    base_entry_fee = float(round_info.get('entry_fee', 0))
    round_total_reward = float(get_round_total_reward(round_info))
    adjusted_entry_fee = base_entry_fee
    adjusted_round_reward = round_total_reward
    safety_net_fee = 0.0
    if requested_modifier == 'double_down':
        adjusted_entry_fee = base_entry_fee * 2
        adjusted_round_reward = round_total_reward * 2
    elif requested_modifier == 'safety_net':
        safety_net_fee = round(base_entry_fee * 0.10, 2)

    if 'gauntlet_session_balance' not in session:
        session['gauntlet_session_balance'] = float(current_user.geek_balance)
    if 'gauntlet_total_correct' not in session:
        session['gauntlet_total_correct'] = 0
        session['gauntlet_total_questions'] = 0
        session['gauntlet_total_score'] = 0
        session['gauntlet_total_geek_earned'] = 0
        session['question_option_map'] = {}
        session['answered_question_ids'] = []
    if round_number > 1:
        session_balance = session.get('gauntlet_session_balance', current_user.geek_balance)
        total_upfront_cost = adjusted_entry_fee + safety_net_fee
        if session_balance < total_upfront_cost:
            flash('Not enough GEEK to enter this round!', 'danger')
            return redirect(url_for('gauntlet_pre_round', round_number=round_number))
        session_balance -= total_upfront_cost
        session['gauntlet_session_balance'] = session_balance
        current_user.geek_balance = session_balance
        db.session.commit()
    selected_topics = []
    if active_run.selected_topics:
        try:
            selected_topics = json.loads(active_run.selected_topics)
        except:
            selected_topics = []
    questions = get_questions_for_round(round_number, selected_topics)
    if len(questions) == 0:
        flash('No questions available! Please try again later.', 'danger')
        return redirect(url_for('geek_gauntlet'))
    if len(questions) < round_info['questions']:
        session['actual_questions_in_round'] = len(questions)
        flash(f'Warning: Only {len(questions)} questions available for this round. Round adapted to available questions.', 'warning')
    session['current_round'] = round_number
    session['round_geek_earned'] = 0
    session['round_correct_answers'] = 0
    session['round_questions_answered'] = 0
    session['round_score'] = 0
    session['round_questions'] = [q.id for q in questions]
    session['current_question_index'] = 0
    session['current_question_id'] = None
    session['round_session_id'] = f"gauntlet_{current_user.id}_{datetime.datetime.utcnow().timestamp()}"
    session['combo_count'] = 0
    session['hot_streak_opening_correct'] = 0
    session['hot_streak_active'] = False
    session['round_modifier'] = requested_modifier
    session['round_entry_fee_charged'] = adjusted_entry_fee
    session['round_total_reward_target'] = adjusted_round_reward
    session['safety_net_fee'] = safety_net_fee
    session['round_live_events'] = []
    session['hint_tokens_remaining'] = 3 if round_info['difficulty'] in ['easy', 'easy-medium'] else (2 if round_info['difficulty'] in ['medium', 'medium-hard', 'hard'] else 1)
    session['is_recycled'] = False
    persist_gauntlet_progress(active_run)
    return redirect(url_for('gauntlet_question'))

@app.route('/gauntlet_question')
@login_required
def gauntlet_question():
    if 'current_round' not in session or 'round_questions' not in session:
        active_run = _active_gauntlet_run_for_user(current_user.id)
        if not restore_gauntlet_progress(active_run):
            flash('No active round!', 'danger')
            return redirect(url_for('geek_gauntlet'))

    current_round = session['current_round']
    question_index = session.get('current_question_index', 0)
    total_questions_in_round = len(session['round_questions'])

    if question_index >= total_questions_in_round:
        return redirect(url_for('gauntlet_round_complete'))

    question_id = session['round_questions'][question_index]
    question = Question.query.get(question_id)

    if not question:
        round_info = GAUNTLET_ROUNDS[current_round - 1]
        selected_topics = session.get('selected_topics', [])
        if isinstance(selected_topics, str):
            try:
                selected_topics = json.loads(selected_topics)
            except (TypeError, ValueError):
                selected_topics = []

        query = Question.query.filter_by(status='approved')
        if '-' in round_info['difficulty']:
            difficulties = round_info['difficulty'].split('-')
            query = query.filter(Question.difficulty.in_(difficulties))
        else:
            query = query.filter_by(difficulty=round_info['difficulty'])

        if selected_topics and len(selected_topics) > 0:
            query = query.filter(Question.topic_id.in_(selected_topics))

        used_questions = session.get('round_questions', [])
        if used_questions:
            query = query.filter(~Question.id.in_(used_questions))

        available_questions = query.all()
        if available_questions:
            question = random.choice(available_questions)
            session['round_questions'][question_index] = question.id
        else:
            fallback_query = Question.query.filter_by(status='approved')
            if used_questions:
                fallback_query = fallback_query.filter(~Question.id.in_(used_questions))
            fallback_questions = fallback_query.all()
            if fallback_questions:
                question = random.choice(fallback_questions)
                session['round_questions'][question_index] = question.id
                session['is_recycled'] = True
            else:
                flash('No questions available!', 'danger')
                return redirect(url_for('geek_gauntlet'))

    times_seen = Attempt.query.filter_by(
        user_id=current_user.id,
        question_id=question.id
    ).count()

    previous_accuracy = 0
    if times_seen > 0:
        previous_attempts = Attempt.query.filter_by(
            user_id=current_user.id,
            question_id=question.id
        ).all()
        correct_count = sum(1 for a in previous_attempts if a.is_correct)
        previous_accuracy = round((correct_count / times_seen) * 100)

    round_info = GAUNTLET_ROUNDS[current_round - 1]
    topic_name = question.topic.name if question.topic else "General"

    streak_bonus = get_streak_multiplier(current_user.current_streak)
    energy = getattr(current_user, 'energy', 100)
    combo_bonus = calculate_combo_bonus(current_user.id)
    combo_count = session.get('combo_count', 0)
    speed_bonus = 1.0
    accuracy_bonus = calculate_accuracy_bonus(current_user.id, question.topic_id)
    season_bonus = calculate_season_bonus()
    season_number = session.get('season_number', 1)
    powerup_bonus = 1.0
    energy_bonus = 1.0
    total_bonus_multiplier = calculate_total_bonus_multiplier(
        current_user,
        streak_bonus,
        combo_bonus,
        speed_bonus,
        accuracy_bonus,
        season_bonus,
        powerup_bonus
    )
    round_total_reward = float(session.get('round_total_reward_target', get_round_total_reward(round_info)))
    questions_in_round = round_info.get('questions', 10)
    base_reward_per_question = round_total_reward / questions_in_round
    question_base_reward = base_reward_per_question
    reward_with_bonus = base_reward_per_question * total_bonus_multiplier
    hint_tokens = session.get('hint_tokens_remaining', 3 if round_info['difficulty'] in ['easy', 'easy-medium'] else (2 if round_info['difficulty'] in ['medium', 'medium-hard', 'hard'] else 1))
    session['hint_tokens_remaining'] = hint_tokens

    round_correct = session.get('round_correct_answers', 0)
    round_total = session.get('round_questions_answered', 0)
    round_accuracy = round((round_correct / round_total * 100) if round_total > 0 else 0, 1)

    recent_attempts = Attempt.query.filter_by(
        user_id=current_user.id,
        session_id=session.get('round_session_id', '')
    ).all()
    if recent_attempts:
        avg_speed = sum(a.time_taken for a in recent_attempts) / len(recent_attempts)
    else:
        avg_speed = 0

    is_recycled = session.get('is_recycled', False)
    time_freeze_active = False
    double_points_active = False
    fifty_fifty_active = False
    shield_active = False

    ai_analysis = get_question_context_analysis(question, current_user)

    original_options = [
        {"original_number": 1, "text": question.option1},
        {"original_number": 2, "text": question.option2},
        {"original_number": 3, "text": question.option3},
        {"original_number": 4, "text": question.option4}
    ]
    random.shuffle(original_options)
    options = []
    option_map = []
    for idx, opt in enumerate(original_options, start=1):
        options.append({"number": idx, "text": opt["text"]})
        option_map.append(opt["original_number"])
    question_option_map = session.get('question_option_map', {})
    question_option_map[str(question.id)] = option_map
    session['question_option_map'] = question_option_map
    session['current_question_id'] = question.id
    persist_gauntlet_progress()

    character_for_question = get_character_for_context('quiz_start')
    character_message = None
    if character_for_question == 'GIGA':
        if times_seen > 3:
            character_message = f"This question has appeared {times_seen} times! Your memory is being tested! 🔥"
        elif times_seen > 1:
            character_message = f"You've seen this before! Let's see if you remember it! 🧠"
        else:
            character_message = get_giga_message(current_user, 'quiz_start')
        current_user.add_character_interaction('GIGA', 'question_presented', {
            'question_id': question.id,
            'round': current_round,
            'times_seen': times_seen
        })
    else:
        if times_seen > 3:
            character_message = f"Question repetition detected. This is the {times_seen}th exposure. Memory retention analysis in progress."
        elif times_seen > 1:
            character_message = f"Repeat question. Previous accuracy: {previous_accuracy}%. Learning efficiency measurable."
        else:
            character_message = get_ace_message(current_user, 'quiz_start')
        current_user.add_character_interaction('ACE', 'question_presented', {
            'question_id': question.id,
            'round': current_round
        })

    return render_template('gauntlet_question.html',
                          question=question,
                          options=options,
                          question_number=question_index + 1,
                          total_questions=total_questions_in_round,
                          round_number=current_round,
                          round_info=round_info,
                          topic_name=topic_name,
                          character_for_question=character_for_question,
                          character_message=character_message,
                          ai_analysis=ai_analysis,
                          streak_bonus=streak_bonus,
                          combo_bonus=combo_bonus,
                          combo_count=combo_count,
                          speed_bonus=speed_bonus,
                          accuracy_bonus=accuracy_bonus,
                          season_bonus=season_bonus,
                          season_number=season_number,
                          energy=energy,
                          energy_bonus=energy_bonus,
                          powerup_bonus=powerup_bonus,
                          total_bonus_multiplier=total_bonus_multiplier,
                          reward_with_bonus=reward_with_bonus,
                          question_base_reward=question_base_reward,
                          hint_tokens=hint_tokens,
                          difficulty=question.difficulty,
                          round_geek_earned=session.get('round_geek_earned', 0.0),
                          is_recycled=is_recycled,
                          times_seen=times_seen,
                          previous_accuracy=previous_accuracy,
                          round_accuracy=round_accuracy,
                          average_speed=round(avg_speed, 1),
                          time_freeze_active=time_freeze_active,
                          double_points_active=double_points_active,
                          fifty_fifty_active=fifty_fifty_active,
                          shield_active=shield_active)

@app.route('/gauntlet_auto_save', methods=['POST'])
@login_required
def gauntlet_auto_save():
    """Auto-save endpoint for seamless progress persistence."""
    active_run = _active_gauntlet_run_for_user(current_user.id)
    if not active_run:
        return jsonify({'success': False, 'message': 'No active run'}), 404
    
    success = persist_gauntlet_progress(active_run)
    if success:
        return jsonify({
            'success': True,
            'saved_at': active_run.active_state_updated_at.isoformat() if active_run.active_state_updated_at else None
        })
    return jsonify({'success': False, 'message': 'Save failed'}), 500

@app.route('/gauntlet_submit_answer', methods=['POST'])
@login_required
def gauntlet_submit_answer():
    if 'current_round' not in session:
        return jsonify({'success': False, 'message': 'No active round!'})

    question_id = request.form.get('question_id')
    if not question_id or str(session.get('current_question_id')) != str(question_id):
        return jsonify({'success': False, 'message': 'Invalid question submission!'})

    answered_ids = session.get('answered_question_ids', [])
    question_index = session.get('current_question_index', 0)
    answered_key = f"{question_id}:{question_index}"
    if answered_key in answered_ids:
        return jsonify({'success': False, 'message': 'Question already answered!'})

    time_taken = float(request.form.get('time_taken', 15.0))
    confidence_level = request.form.get('confidence_level', type=int)
    question = Question.query.get(question_id)
    if not question:
        return jsonify({'success': False, 'message': 'Question not found!'})

    timed_out = str(request.form.get('timed_out', '0')).lower() in ('1', 'true', 'yes')
    selected_option_raw = request.form.get('selected_option')
    selected_option = None
    option_map = session.get('question_option_map', {}).get(str(question_id), [])
    if not option_map:
        return jsonify({'success': False, 'message': 'Invalid answer option!'})

    if timed_out:
        selected_option = None
        is_correct = False
    else:
        if selected_option_raw not in (None, ''):
            try:
                selected_option = int(selected_option_raw)
            except (TypeError, ValueError):
                return jsonify({'success': False, 'message': 'Invalid answer option!'})
        if selected_option is None:
            return jsonify({'success': False, 'message': 'Please select an answer!'})
        if selected_option < 1 or selected_option > len(option_map):
            return jsonify({'success': False, 'message': 'Invalid answer option!'})
        original_number = option_map[selected_option - 1]
        is_correct = (original_number == question.correct_option)

    current_round = session['current_round']
    round_info = GAUNTLET_ROUNDS[current_round - 1]
    round_modifier = session.get('round_modifier', 'none')
    answered_before = session.get('round_questions_answered', 0)
    previous_combo_count = session.get('combo_count', 0)
    question_score = calculate_score_per_question(time_taken) if is_correct else 0
    session['round_questions_answered'] += 1
    session['round_score'] += question_score

    streak_bonus = get_streak_multiplier(current_user.current_streak)

    if is_correct:
        session['combo_count'] = previous_combo_count + 1
    else:
        session['combo_count'] = 0

    combo_bonus = calculate_combo_bonus(current_user.id)
    combo_count = session.get('combo_count', 0)
    speed_bonus = calculate_speed_bonus(time_taken, question.difficulty)
    accuracy_bonus = calculate_accuracy_bonus(current_user.id, question.topic_id)
    season_bonus = calculate_season_bonus()
    powerup_bonus = get_powerup_bonus_multiplier(request.form.get('powerups_used'))
    total_bonus_multiplier = calculate_total_bonus_multiplier(
        current_user,
        streak_bonus,
        combo_bonus,
        speed_bonus,
        accuracy_bonus,
        season_bonus,
        powerup_bonus
    )

    question_base_reward = float(request.form.get('question_base_reward', 0))
    modifier_multiplier = 1.0

    if round_modifier == 'hot_streak' and answered_before < 3:
        if is_correct:
            session['hot_streak_opening_correct'] = session.get('hot_streak_opening_correct', 0) + 1
            if session['hot_streak_opening_correct'] >= 3:
                session['hot_streak_active'] = True
        else:
            session['hot_streak_opening_correct'] = -999
    if round_modifier == 'hot_streak' and session.get('hot_streak_active', False) and answered_before >= 3 and is_correct:
        modifier_multiplier = 1.5

    if is_correct:
        if question_base_reward <= 0:
            round_total_reward = float(session.get('round_total_reward_target', get_round_total_reward(round_info)))
            questions_in_round = round_info.get('questions', 10)
            question_base_reward = round_total_reward / questions_in_round

        geek_earned = question_base_reward * total_bonus_multiplier * modifier_multiplier

        session['round_geek_earned'] += geek_earned
        session['round_correct_answers'] += 1

        award_creator_earnings(
            question_id,
            CCE_CREATOR_REWARD_PER_SERVE,
            session.get('round_session_id', ''),
            current_user.id
        )
        update_question_metrics(question_id, time_taken)
    else:
        geek_earned = 0

    current_user.update_topic_accuracy(question.topic_id, is_correct)

    attempt = Attempt(
        user_id=current_user.id,
        question_id=question_id,
        selected_option=selected_option if selected_option is not None else 0,
        is_correct=is_correct,
        time_taken=time_taken,
        session_id=session.get('round_session_id', ''),
        was_skipped=selected_option is None,
        streak_bonus_applied=streak_bonus,
        character_present=request.form.get('character_present', 'GIGA'),
        character_message_shown=request.form.get('character_message', ''),
        confidence_level=confidence_level,
        hour_of_day=datetime.datetime.now().hour,
        day_of_week=datetime.datetime.now().weekday()
    )
    db.session.add(attempt)
    db.session.commit()

    total_correct = Attempt.query.filter_by(user_id=current_user.id, is_correct=True).count()
    check_achievements(current_user, 'correct_answers', total_correct)
    if is_correct and time_taken < 3:
        speed_correct = Attempt.query.filter(
            Attempt.user_id == current_user.id,
            Attempt.is_correct == True,
            Attempt.time_taken < 3
        ).count()
        check_achievements(current_user, 'under_3s_answers', speed_correct)

    if combo_count >= 10:
        check_achievements(current_user, 'combo_10', 1)
    elif combo_count >= 7:
        check_achievements(current_user, 'combo_7', 1)
    elif combo_count >= 5:
        check_achievements(current_user, 'combo_5', 1)
    elif combo_count >= 3:
        check_achievements(current_user, 'combo_3', 1)

    session['current_question_index'] += 1
    answered_ids.append(answered_key)
    session['answered_question_ids'] = answered_ids
    session['gauntlet_total_correct'] = session.get('gauntlet_total_correct', 0) + (1 if is_correct else 0)
    session['gauntlet_total_questions'] = session.get('gauntlet_total_questions', 0) + 1
    session['gauntlet_total_score'] = session.get('gauntlet_total_score', 0) + int(question_score)
    session['gauntlet_total_geek_earned'] = session.get('gauntlet_total_geek_earned', 0.0) + float(geek_earned)

    correct_option_display = option_map.index(question.correct_option) + 1 if question.correct_option in option_map else question.correct_option

    character_response = None
    if is_correct:
        if combo_count in (3, 5, 7, 10):
            milestone_context = f'combo_milestone_{combo_count}'
            character_response = get_giga_message(current_user, milestone_context)
            current_user.add_character_interaction('GIGA', 'combo_milestone', {
                'question_id': question_id,
                'combo': combo_count
            })
        elif time_taken < 5:
            character_response = get_ace_message(current_user, 'fast_answer')
            current_user.add_character_interaction('ACE', 'fast_correct_answer', {
                'question_id': question_id,
                'time_taken': time_taken,
                'combo': combo_count
            })
        else:
            character_response = get_giga_message(current_user, 'correct_answer')
            current_user.add_character_interaction('GIGA', 'correct_answer', {
                'question_id': question_id,
                'score': question_score,
                'combo': combo_count
            })
    else:
        if previous_combo_count >= 3:
            character_response = get_giga_message(current_user, 'near_miss')
            current_user.add_character_interaction('GIGA', 'near_miss', {
                'question_id': question_id,
                'combo_lost': previous_combo_count
            })
        else:
            character_response = get_giga_message(current_user, 'incorrect_answer')
        current_user.add_character_interaction('GIGA', 'incorrect_answer', {
            'question_id': question_id
        })

    persist_gauntlet_progress()

    return jsonify({
        'success': True,
        'is_correct': is_correct,
        'timed_out': timed_out,
        'correct_option': correct_option_display,
        'geek_earned': round(geek_earned, 2),
        'total_geek_earned': round(session['round_geek_earned'], 2),
        'correct_answers': session['round_correct_answers'],
        'questions_answered': session['round_questions_answered'],
        'question_score': int(question_score),
        'total_score': int(session['round_score']),
        'streak_multiplier': streak_bonus,
        'streak_count': current_user.current_streak,
        'combo_bonus': combo_bonus,
        'combo_count': combo_count,
        'combo_bonus_applied': combo_bonus > 1.0,
        'speed_bonus_applied': speed_bonus > 1.0,
        'accuracy_bonus_applied': accuracy_bonus > 1.0,
        'season_bonus_applied': season_bonus > 1.0,
        'double_points_applied': powerup_bonus > 1.0,
        'energy_bonus_applied': False,
        'bonus_earned': total_bonus_multiplier > 1.0,
        'total_bonus_multiplier': round(total_bonus_multiplier, 2),
        'character_response': character_response,
        'question_topic': question.topic.name if question.topic else 'General',
        'correct_option_text': getattr(question, f'option{question.correct_option}', ''),
        'fun_fact': question.fun_fact or '',
        'modifier_applied': round_modifier,
        'hot_streak_active': session.get('hot_streak_active', False)
    })

# ==================== GAUNTLET API ENDPOINTS (AJAX) ====================

@app.route('/api/gauntlet/next_question')
@login_required
def api_gauntlet_next_question():
    """Returns JSON for the next question — used by AJAX-powered question page."""
    if 'current_round' not in session or 'round_questions' not in session:
        return jsonify({'success': False, 'done': False, 'error': 'No active round'})

    current_round = session['current_round']
    question_index = session.get('current_question_index', 0)
    total_questions_in_round = len(session['round_questions'])

    if question_index >= total_questions_in_round:
        return jsonify({'success': True, 'done': True, 'redirect': url_for('gauntlet_round_complete')})

    question_id = session['round_questions'][question_index]
    question = Question.query.get(question_id)
    if not question:
        return jsonify({'success': False, 'done': False, 'error': 'Question not found'})

    round_info = GAUNTLET_ROUNDS[current_round - 1]
    topic_name = question.topic.name if question.topic else 'General'
    round_total_reward = float(session.get('round_total_reward_target', get_round_total_reward(round_info)))
    base_reward_per_question = round_total_reward / max(round_info.get('questions', 10), 1)

    original_options = [
        {"original_number": 1, "text": question.option1},
        {"original_number": 2, "text": question.option2},
        {"original_number": 3, "text": question.option3},
        {"original_number": 4, "text": question.option4}
    ]
    random.shuffle(original_options)
    options = []
    option_map = []
    for idx, opt in enumerate(original_options, start=1):
        options.append({"number": idx, "text": opt["text"]})
        option_map.append(opt["original_number"])

    question_option_map = session.get('question_option_map', {})
    question_option_map[str(question.id)] = option_map
    session['question_option_map'] = question_option_map
    session['current_question_id'] = question.id

    character = get_character_for_context('quiz_start')
    times_seen = Attempt.query.filter_by(user_id=current_user.id, question_id=question.id).count()
    if character == 'GIGA':
        if times_seen > 1:
            msg = f"You've seen this before! Let's see if you remember it! 🧠"
        else:
            msg = get_giga_message(current_user, 'quiz_start')
    else:
        if times_seen > 1:
            msg = f"Repeat question. Previous exposure detected. Apply retained knowledge."
        else:
            msg = get_ace_message(current_user, 'quiz_start')

    combo_count = session.get('combo_count', 0)
    hint_tokens = session.get('hint_tokens_remaining', 3 if round_info['difficulty'] in ['easy', 'easy-medium'] else (2 if round_info['difficulty'] in ['medium', 'medium-hard', 'hard'] else 1))
    session['hint_tokens_remaining'] = hint_tokens
    persist_gauntlet_progress()

    return jsonify({
        'success': True,
        'done': False,
        'question_id': question.id,
        'question_text': question.question,
        'options': options,
        'difficulty': question.difficulty,
        'topic': topic_name,
        'fun_fact': question.fun_fact or '',
        'question_number': question_index + 1,
        'total_questions': total_questions_in_round,
        'round_number': current_round,
        'time_limit': 15,
        'combo_count': combo_count,
        'character': character,
        'character_message': msg,
        'hint_tokens': hint_tokens,
        'round_modifier': session.get('round_modifier', 'none'),
        'question_base_reward': round(base_reward_per_question, 3),
        'round_score': session.get('round_score', 0),
        'round_geek_earned': round(session.get('round_geek_earned', 0), 2),
        'is_recycled': session.get('is_recycled', False)
    })


@app.route('/api/gauntlet/ai_hint', methods=['POST'])
@login_required
def api_gauntlet_ai_hint():
    """Spend a hint token and get an AI-voiced contextual hint."""
    if 'current_round' not in session:
        return jsonify({'success': False, 'error': 'No active round'})
    hint_tokens = session.get('hint_tokens_remaining', 0)
    if hint_tokens <= 0:
        return jsonify({'success': False, 'error': 'No hint tokens remaining'})
    question_id = request.json.get('question_id') if request.is_json else request.form.get('question_id')
    question = Question.query.get(question_id)
    if not question:
        return jsonify({'success': False, 'error': 'Question not found'})

    session['hint_tokens_remaining'] = hint_tokens - 1
    persist_gauntlet_progress()

    character = get_character_for_context('quiz_start')
    wrong_options = [getattr(question, f'option{i}', '') for i in range(1, 5) if i != question.correct_option]
    eliminate = random.choice(wrong_options) if wrong_options else ''
    topic_name = question.topic.name if question.topic else 'this topic'
    voice_line = get_giga_message(current_user, 'gauntlet_hint') if character == 'GIGA' else get_ace_message(current_user, 'gauntlet_hint')
    if eliminate:
        hint_text = f"{voice_line} Rule out '{eliminate}'. Focus on {topic_name} fundamentals."
    else:
        hint_text = f"{voice_line} Focus on {topic_name} fundamentals and eliminate the most extreme option."
    return jsonify({
        'success': True,
        'hint': hint_text,
        'character': character,
        'tokens_remaining': session['hint_tokens_remaining']
    })


@app.route('/api/gauntlet/live_event')
@login_required
def api_gauntlet_live_event():
    """Returns current live event state or randomly triggers a new event."""
    if 'current_round' not in session:
        return jsonify({'event': 'none'})

    current_event = session.get('live_event', 'none')
    event_used = session.get('live_event_used', False)
    questions_answered = session.get('round_questions_answered', 0)

    # Clear expired events (only last 1 question)
    if current_event != 'none' and session.get('live_event_question', -1) < questions_answered - 1:
        session['live_event'] = 'none'
        current_event = 'none'
        session['live_event_active'] = False
        persist_gauntlet_progress()

    if current_event != 'none':
        return jsonify({'event': current_event, 'data': session.get('live_event_data', {})})

    # Only trigger events after question 2, max once per 3 questions
    last_event_q = session.get('last_event_question', -5)
    if questions_answered < 2 or questions_answered - last_event_q < 3:
        return jsonify({'event': 'none'})

    # ~20% chance of triggering an event
    if random.random() > 0.20:
        return jsonify({'event': 'none'})

    current_round = session.get('current_round', 1)
    events = ['multiplier_surge', 'bonus_question', 'community_challenge', 'hot_topic']
    # Sudden death only once per session, only round 5+
    if not event_used and current_round >= 5 and random.random() < 0.15:
        events.append('sudden_death')

    event = random.choice(events)
    if event == 'sudden_death':
        session['live_event_used'] = True

    session['live_event'] = event
    session['live_event_question'] = questions_answered
    session['last_event_question'] = questions_answered
    session['live_event_active'] = True

    event_data = {}
    if event == 'multiplier_surge':
        event_data = {'multiplier': 3, 'questions': 5}
        session['event_multiplier'] = 3.0
        session['event_multiplier_questions'] = 5
    elif event == 'hot_topic':
        from_topics = session.get('selected_topics', [])
        topic = Topic.query.get(random.choice(from_topics)) if from_topics else None
        event_data = {'topic': topic.name if topic else 'General', 'questions': 3}
        session['hot_topic_name'] = topic.name if topic else ''
        session['hot_topic_questions'] = 3
    elif event == 'community_challenge':
        active_players = GauntletRun.query.filter_by(completed=False).count()
        event_data = {'players': max(1, active_players)}
    elif event == 'sudden_death':
        warning_character = get_character_for_context('quiz_start')
        warning = get_giga_message(current_user, 'sudden_death_warning') if warning_character == 'GIGA' else get_ace_message(current_user, 'sudden_death_warning')
        event_data = {'warning': warning}

    session['live_event_data'] = event_data
    round_events = session.get('round_live_events', [])
    round_events.append(event)
    session['round_live_events'] = round_events
    persist_gauntlet_progress()
    return jsonify({'event': event, 'data': event_data, 'new': True})


@app.route('/api/gauntlet/round_leaderboard/<int:round_number>')
@login_required
def api_gauntlet_round_leaderboard(round_number):
    """Returns top players who completed this round today for social comparison."""
    today_start = datetime.datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    completed_today = GauntletRun.query.filter(
        GauntletRun.completed == True,
        GauntletRun.highest_round == round_number,
        GauntletRun.date_completed >= today_start
    ).order_by(GauntletRun.total_geek_earned.desc()).all()

    leaderboard = []
    for run in completed_today:
        user = User.query.get(run.user_id)
        if user:
            leaderboard.append({
                'username': user.username or user.email.split('@')[0],
                'score': round(run.total_geek_earned, 1),
                'round': run.highest_round,
                'is_current_user': run.user_id == current_user.id
            })

    # Find current user's rank
    user_rank = None
    for i, entry in enumerate(leaderboard):
        if entry['is_current_user']:
            user_rank = i + 1
            break

    # Get player history for this round
    user_runs = GauntletRun.query.filter_by(user_id=current_user.id)\
        .filter(GauntletRun.highest_round >= round_number).all()
    best_score = max((r.total_geek_earned for r in user_runs if r.completed), default=0)
    attempt_count = len(user_runs)
    completed_count = sum(1 for r in user_runs if r.completed)

    return jsonify({
        'leaderboard': leaderboard[:10],
        'user_rank': user_rank,
        'total_players': len(leaderboard),
        'user_history': {
            'best_score': round(best_score, 1),
            'attempts': attempt_count,
            'win_rate': round((completed_count / max(attempt_count, 1)) * 100, 1)
        }
    })


@app.route('/gauntlet_timeout')
@login_required
def gauntlet_timeout():
    if 'current_round' not in session or 'round_questions' not in session:
        flash('No active round!', 'danger')
        return redirect(url_for('geek_gauntlet'))

    question_id = session.get('current_question_id')
    if not question_id:
        return redirect(url_for('gauntlet_question'))

    answered_ids = session.get('answered_question_ids', [])
    question_index = session.get('current_question_index', 0)
    answered_key = f"{question_id}:{question_index}"
    if answered_key in answered_ids:
        return redirect(url_for('gauntlet_question'))

    question = Question.query.get(question_id)
    if question:
        current_user.update_topic_accuracy(question.topic_id, False)
        attempt = Attempt(
            user_id=current_user.id,
            question_id=question_id,
            selected_option=0,
            is_correct=False,
            time_taken=15.0,
            session_id=session.get('round_session_id', ''),
            was_skipped=True,
            streak_bonus_applied=get_streak_multiplier(current_user.current_streak),
            character_present='GIGA',
            character_message_shown='Timed out',
            confidence_level=None,
            hour_of_day=datetime.datetime.now().hour,
            day_of_week=datetime.datetime.now().weekday()
        )
        db.session.add(attempt)
        db.session.commit()
        update_question_metrics(question_id, 15.0, was_skipped=True)

    session['round_questions_answered'] = session.get('round_questions_answered', 0) + 1
    session['round_score'] = session.get('round_score', 0)
    session['current_question_index'] = session.get('current_question_index', 0) + 1
    session['combo_count'] = 0
    answered_ids.append(answered_key)
    session['answered_question_ids'] = answered_ids
    session['gauntlet_total_questions'] = session.get('gauntlet_total_questions', 0) + 1
    session['gauntlet_total_score'] = session.get('gauntlet_total_score', 0)
    session['gauntlet_total_geek_earned'] = session.get('gauntlet_total_geek_earned', 0.0)
    persist_gauntlet_progress()

    return redirect(url_for('gauntlet_question'))

@app.route('/gauntlet_round_complete')
@login_required
def gauntlet_round_complete():
    if 'current_round' not in session:
        flash('No active round!', 'danger')
        return redirect(url_for('geek_gauntlet'))
    active_run = GauntletRun.query.filter_by(user_id=current_user.id, completed=False).first()
    if not active_run:
        flash('No active Gauntlet run found!', 'danger')
        return redirect(url_for('geek_gauntlet'))
    current_round = session['current_round']
    round_info = GAUNTLET_ROUNDS[current_round - 1]
    expected_total_reward = float(session.get('round_total_reward_target', get_round_total_reward(round_info)))
    actual_geek_earned = session.get('round_geek_earned', 0)
    round_modifier = session.get('round_modifier', 'none')
    safety_net_refund = 0.0
    if round_modifier == 'safety_net' and session.get('round_correct_answers', 0) < round_info.get('break_even', 0):
        safety_net_refund = round(session.get('round_entry_fee_charged', float(round_info.get('entry_fee', 0))) * 0.5, 2)
        session['round_geek_earned'] += safety_net_refund
        actual_geek_earned = session.get('round_geek_earned', 0)

    milestone_bonus = 0.0
    if current_round % 10 == 0:
        milestone_bonus = round_info['entry_fee'] * 0.5
        session['round_geek_earned'] += milestone_bonus

    active_run.highest_round = current_round
    active_run.total_correct += session['round_correct_answers']
    active_run.total_questions += session['round_questions_answered']
    active_run.total_geek_earned += session['round_geek_earned']
    current_user.geek_balance += session['round_geek_earned']
    session['gauntlet_session_balance'] = float(current_user.geek_balance)
    session['gauntlet_total_geek_earned'] = session.get('gauntlet_total_geek_earned', 0.0)
    unlocked_achievements = get_unlocked_achievement_objects(
        check_achievements(current_user, 'gauntlet_round', current_round)
    )
    if current_round >= 8:
        pack_type = 'legendary'
    elif current_round >= 5:
        pack_type = 'premium'
    else:
        pack_type = 'standard'
    db.session.add(StickerPack(
        user_id=current_user.id,
        pack_type=pack_type,
        source='gauntlet',
        source_detail=f'Completed Gauntlet Round {current_round}'
    ))
    session['pending_pack_notification'] = f'🎁 You earned a {pack_type} sticker pack!'

    # Show a real sticker art preview for the earned pack tier on the round-complete page.
    rarity_for_pack = {
        'standard': 'common',
        'premium': 'rare',
        'legendary': 'legendary'
    }.get(pack_type, 'common')
    pack_preview_sticker = Sticker.query.filter_by(rarity=rarity_for_pack).order_by(db.func.random()).first()
    if not pack_preview_sticker:
        pack_preview_sticker = Sticker.query.order_by(db.func.random()).first()
    
    if session['round_correct_answers'] == session['round_questions_answered']:
        character_message = get_ace_message(current_user, 'perfect_round')
        current_user.add_character_interaction('ACE', 'perfect_round', {
            'round': current_round,
            'correct': session['round_correct_answers'],
            'total': session['round_questions_answered']
        })
    else:
        character_message = get_giga_message(current_user, 'gauntlet_round_complete')
        current_user.add_character_interaction('GIGA', 'round_complete', {
            'round': current_round,
            'correct': session['round_correct_answers'],
            'total': session['round_questions_answered']
        })
    
    level_up = current_user.update_level()
    if level_up and current_user.level % 10 == 0:
        reward = current_user.get_milestone_reward(current_user.level)
        current_user.geek_balance += reward.get('geek', 0)
        current_user.xp += reward.get('xp', 0)
        stage = get_level_stage(current_user.level)
        flash(f'🎉🎉🎉 MILESTONE UNLOCKED! Level {current_user.level} - {stage["tag"]}! 🎉🎉🎉', 'success')
        flash(f'🏆 Milestone Reward: +{reward.get("geek", 0)} GEEK, +{reward.get("xp", 0)} XP!', 'success')

    next_round = current_round + 1 if current_round < len(GAUNTLET_ROUNDS) else None
    # Keep resume metadata updated across breaks after round completion.
    active_run.active_round = next_round if next_round else current_round
    active_run.active_state = None
    active_run.active_state_updated_at = datetime.datetime.utcnow()
    db.session.commit()
    can_afford_next = False
    kaspa_needed_next = 0
    if next_round:
        next_round_info = GAUNTLET_ROUNDS[next_round - 1]
        can_afford_next = current_user.geek_balance >= next_round_info['entry_fee']
        if not can_afford_next:
            exchange_rate = KaspaPrice.get_rate()
            kaspa_needed_next = next_round_info['entry_fee'] / exchange_rate
            kaspa_needed_next = math.ceil(kaspa_needed_next * 10) / 10
    selected_topics = []
    topic_names = []
    if active_run.selected_topics:
        try:
            selected_topics = json.loads(active_run.selected_topics)
            for cat_id in selected_topics:
                topic = Topic.query.get(cat_id)
                if topic:
                    topic_names.append(topic.name)
        except:
            pass
    xp_earned = calculate_xp_for_run(session.get('gauntlet_total_correct', 0), session.get('gauntlet_total_score', 0))
    current_stage = get_level_stage(current_user.level)

    wrong_answers = max(0, session.get('round_questions_answered', 0) - session.get('round_correct_answers', 0))
    per_question_reward = expected_total_reward / max(round_info.get('questions', 10), 1)
    near_miss_potential = round(wrong_answers * per_question_reward, 2)

    round_total_after_bonus = round(session.get('round_geek_earned', 0), 2)
    combo_bonus_earned = round(round_total_after_bonus * (0.12 if session.get('combo_count', 0) >= 3 else 0.0), 2)
    speed_bonus_earned = round(round_total_after_bonus * (0.08 if session.get('round_correct_answers', 0) >= round_info.get('break_even', 0) else 0.0), 2)
    event_bonus_earned = round(round_total_after_bonus * (0.10 if session.get('round_live_events', []) else 0.0), 2)
    streak_bonus_earned = round(round_total_after_bonus * (0.06 if current_user.current_streak >= 3 else 0.0), 2)
    base_earnings = max(round(round_total_after_bonus - combo_bonus_earned - speed_bonus_earned - event_bonus_earned - streak_bonus_earned, 2), 0.0)

    completed_before = GauntletRun.query.filter(
        GauntletRun.user_id == current_user.id,
        GauntletRun.completed == True
    ).all()
    best_round_score = max((run.total_geek_earned for run in completed_before if run.highest_round >= current_round), default=0.0)
    best_round_accuracy = max(
        ((run.total_correct / run.total_questions) * 100 for run in completed_before if run.total_questions > 0),
        default=0.0
    )
    personal_bests = []
    current_accuracy = (session.get('round_correct_answers', 0) / max(session.get('round_questions_answered', 1), 1)) * 100
    if round_total_after_bonus > best_round_score:
        personal_bests.append(f"New best round earnings: {round_total_after_bonus:.1f} GEEK")
    if current_accuracy > best_round_accuracy:
        personal_bests.append(f"New best accuracy pace: {current_accuracy:.1f}%")

    today_start = datetime.datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    peers_today_runs = GauntletRun.query.filter(
        GauntletRun.completed == True,
        GauntletRun.highest_round >= current_round,
        GauntletRun.date_completed >= today_start
    ).all()
    peers_today = []
    for run in peers_today_runs:
        user = User.query.get(run.user_id)
        if user:
            peers_today.append({
                'username': user.username or user.email.split('@')[0],
                'score': float(run.total_geek_earned),
                'is_current': run.user_id == current_user.id
            })
    peers_today.sort(key=lambda x: x['score'], reverse=True)

    projected_score = float(active_run.total_geek_earned)
    higher_scores = sum(1 for row in peers_today if row['score'] > projected_score and not row['is_current'])
    social_rank = higher_scores + 1
    social_total = max(len(peers_today), 1)
    prev_target = peers_today[social_rank - 2] if social_rank - 2 >= 0 and social_rank - 2 < len(peers_today) else None
    next_target = peers_today[social_rank] if social_rank < len(peers_today) else None

    gauntlet_progress = min(100, round((current_round / len(GAUNTLET_ROUNDS)) * 100, 1))
    achievement_progress = {
        'name': 'Gauntlet Champion',
        'percent': gauntlet_progress
    }

    strongest_topic = topic_names[0] if topic_names else "General Knowledge"
    weakest_topic = "no weak topics!" if wrong_answers == 0 else (topic_names[-1] if topic_names else "Mixed Topics")
    historical_attempts = Attempt.query.filter_by(user_id=current_user.id).all()
    historical_avg = (sum(a.time_taken for a in historical_attempts) / len(historical_attempts)) if historical_attempts else 0
    round_attempts = Attempt.query.filter_by(user_id=current_user.id, session_id=session.get('round_session_id', '')).all()
    round_avg = (sum(a.time_taken for a in round_attempts) / len(round_attempts)) if round_attempts else 0
    ai_debrief = {
        'strongest_topic': strongest_topic,
        'weakest_topic': weakest_topic,
        'round_avg_time': round(round_avg, 2),
        'historical_avg_time': round(historical_avg, 2),
        'near_miss_gain': near_miss_potential,
        'recommendation': "Review missed topics and protect your first-3-question consistency for multiplier potential."
    }

    next_round_entry_fee = None
    if next_round:
        next_round_entry_fee = GAUNTLET_ROUNDS[next_round - 1].get('entry_fee', 0)

    return render_template('gauntlet_round_complete.html',
                         round_number=current_round,
                         round_info=round_info,
                         expected_total_reward=round(expected_total_reward, 2),
                         actual_geek_earned=round(actual_geek_earned, 2),
                         correct_answers=session['round_correct_answers'],
                         total_questions=session['round_questions_answered'],
                         accuracy=round((session['round_correct_answers'] / session['round_questions_answered'] * 100) if session['round_questions_answered'] > 0 else 0, 1),
                         geek_earned=round(session['round_geek_earned'], 2),
                         milestone_bonus=round(milestone_bonus, 2) if milestone_bonus > 0 else 0,
                         total_geek_earned=round(active_run.total_geek_earned, 2),
                         xp_earned=xp_earned,
                         next_round=next_round,
                         can_afford_next=can_afford_next,
                         kaspa_needed_next=kaspa_needed_next,
                         topic_names=topic_names,
                         topics_count=len(selected_topics),
                         round_modifier=round_modifier,
                         safety_net_refund=round(safety_net_refund, 2),
                         base_earnings=base_earnings,
                         combo_bonus_earned=combo_bonus_earned,
                         speed_bonus_earned=speed_bonus_earned,
                         event_bonus_earned=event_bonus_earned,
                         streak_bonus_earned=streak_bonus_earned,
                         wrong_answers=wrong_answers,
                         near_miss_potential=near_miss_potential,
                         personal_bests=personal_bests,
                         social_rank=social_rank,
                         social_total=social_total,
                         social_prev=prev_target,
                         social_next=next_target,
                         achievement_progress=achievement_progress,
                         ai_debrief=ai_debrief,
                         next_round_entry_fee=next_round_entry_fee,
                         GAUNTLET_ROUNDS=GAUNTLET_ROUNDS,
                         unlocked_achievements=unlocked_achievements,
                         character_message=character_message,
                         pack_type=pack_type,
                         pack_preview_sticker=pack_preview_sticker,
                         current_level=current_user.level,
                         level_stage=current_stage)

@app.route('/gauntlet_next_round/<int:next_round>')
@login_required
def gauntlet_next_round(next_round):
    if next_round < 1 or next_round > len(GAUNTLET_ROUNDS):
        flash('Invalid round number!', 'danger')
        return redirect(url_for('geek_gauntlet'))
    active_run = GauntletRun.query.filter_by(user_id=current_user.id, completed=False).first()
    if active_run:
        active_run.active_round = next_round
        active_run.active_state = None
        active_run.active_state_updated_at = datetime.datetime.utcnow()
        db.session.commit()
    return redirect(url_for('gauntlet_pre_round', round_number=next_round))

@app.route('/gauntlet_exit')
@login_required
def gauntlet_exit():
    active_run = GauntletRun.query.filter_by(user_id=current_user.id, completed=False).first()
    if active_run:
        clear_persisted_gauntlet_progress(active_run)
        active_run.completed = True
        active_run.date_completed = datetime.datetime.utcnow()
        total_correct = session.get('gauntlet_total_correct', active_run.total_correct)
        total_score = session.get('gauntlet_total_score', 0)
        xp_earned = calculate_xp_for_run(total_correct, total_score)
        active_run.total_xp_earned = xp_earned
        current_user.xp += xp_earned
        current_user.points += total_score
        current_user.update_level()
        
        character_message = get_giga_message(current_user, 'gauntlet_complete')
        current_user.add_character_interaction('GIGA', 'gauntlet_complete', {
            'highest_round': active_run.highest_round,
            'total_correct': total_correct,
            'total_score': total_score
        })
        
        db.session.commit()
        session_vars = [
            'gauntlet_run_id', 'current_round', 'round_geek_earned',
            'round_correct_answers', 'round_questions_answered', 'round_questions',
            'current_question_index', 'round_session_id', 'round_score',
            'gauntlet_total_correct', 'gauntlet_total_questions', 'gauntlet_total_score',
            'gauntlet_total_geek_earned', 'gauntlet_session_balance', 'question_option_map',
            'answered_question_ids', 'current_question_id',
            'combo_count', 'is_recycled', 'season_number', 'season_year',
            'round_modifier', 'round_entry_fee_charged', 'round_total_reward_target',
            'safety_net_fee', 'hot_streak_active', 'hot_streak_opening_correct',
            'hint_tokens_remaining', 'live_event', 'live_event_data', 'live_event_used',
            'live_event_question', 'last_event_question', 'live_event_active',
            'event_multiplier', 'event_multiplier_questions', 'hot_topic_name',
            'hot_topic_questions', 'round_live_events'
        ]
        for var in session_vars:
            session.pop(var, None)
    return redirect(url_for('gauntlet_results'))

@app.route('/gauntlet_results')
@login_required
def gauntlet_results():
    latest_run = GauntletRun.query.filter_by(
        user_id=current_user.id,
        completed=True
    ).order_by(GauntletRun.date_completed.desc()).first()
    if not latest_run:
        flash('No completed Gauntlet runs found!', 'info')
        return redirect(url_for('geek_gauntlet'))
    selected_topics = []
    topic_names = []
    if latest_run.selected_topics:
        try:
            selected_topics = json.loads(latest_run.selected_topics)
            for cat_id in selected_topics:
                topic = Topic.query.get(cat_id)
                if topic:
                    topic_names.append(topic.name)
        except:
            pass
    claim = GauntletClaim.query.filter_by(user_id=current_user.id, run_id=latest_run.id).first()

    user_runs = GauntletRun.query.filter_by(user_id=current_user.id, completed=True).all()
    career_stats = {
        'total_runs': len(user_runs),
        'best_round': max((r.highest_round for r in user_runs), default=0),
        'total_geek': round(sum((r.total_geek_earned or 0.0) for r in user_runs), 2),
        'total_questions': sum((r.total_questions or 0) for r in user_runs),
        'total_correct': sum((r.total_correct or 0) for r in user_runs),
        'avg_accuracy': 0.0,
        'total_xp': sum((r.total_xp_earned or 0) for r in user_runs)
    }
    if career_stats['total_questions'] > 0:
        career_stats['avg_accuracy'] = round((career_stats['total_correct'] / career_stats['total_questions']) * 100, 1)

    return render_template('gauntlet_results.html',
                         run=latest_run,
                         topic_names=topic_names,
                         topics_count=len(selected_topics),
                         career_stats=career_stats,
                         claim=claim)

@app.route('/gauntlet_claim/<int:run_id>', methods=['POST'])
@login_required
def gauntlet_claim(run_id):
    run = GauntletRun.query.get(run_id)
    if not run or run.user_id != current_user.id:
        flash('Invalid gauntlet claim.', 'danger')
        return redirect(url_for('gauntlet_results'))
    if not run.completed:
        flash('You can only claim after completing the run.', 'warning')
        return redirect(url_for('gauntlet_results'))
    existing = GauntletClaim.query.filter_by(user_id=current_user.id, run_id=run.id).first()
    if existing:
        flash('Rewards already claimed for this run.', 'info')
        return redirect(url_for('gauntlet_results'))
    if not current_user.wallet_address:
        flash('Please connect your wallet first!', 'danger')
        return redirect(url_for('dashboard'))
    claim = GauntletClaim(
        user_id=current_user.id,
        run_id=run.id,
        amount=run.total_geek_earned,
        status='claimed'
    )
    db.session.add(claim)
    db.session.commit()
    flash('Claim submitted! Your rewards will be processed shortly.', 'success')
    return redirect(url_for('gauntlet_results'))

# OLD daily_quiz route - DEPRECATED - Use the new one below with AJAX support
# @app.route('/daily_quiz')
# @login_required
# def daily_quiz_old():
#     daily_quiz_limit = 10
#     utc_now = datetime.datetime.utcnow()
#     start_of_day_utc = utc_now.replace(hour=0, minute=0, second=0, microsecond=0)
#     daily_attempts = Attempt.query.filter(
#         Attempt.user_id == current_user.id,
#         Attempt.date_attempted >= start_of_day_utc
#     ).count()
#     remaining_questions_today = max(0, daily_quiz_limit - daily_attempts)
# 
#     selected_topics = get_user_topics_preferences(current_user.id)
#     attempted_questions = db.session.query(Attempt.question_id).filter_by(user_id=current_user.id).all()
#     attempted_question_ids = [q[0] for q in attempted_questions] if attempted_questions else []
#     query = Question.query.filter(
#         Question.status == 'approved',
#         ~Question.id.in_(attempted_question_ids)
#     )
#     if selected_topics and len(selected_topics) > 0:
#         query = query.filter(Question.topic_id.in_(selected_topics))
#     questions = query.limit(remaining_questions_today).all() if remaining_questions_today > 0 else []
#     question = questions[0] if questions else None
#     return render_template(
#         'daily_quiz.html',
#         questions=questions,
#         question=question,
#         daily_quiz_limit=daily_quiz_limit,
#         daily_attempts=daily_attempts,
#         remaining_questions_today=remaining_questions_today,
#         daily_limit_reached=(remaining_questions_today == 0),
#         current_question_num=daily_attempts + 1,
#         combo_count=session.get('combo_count', 0),
#         session_score=session.get('session_score', 0)
#     )

@app.route('/submit_answer', methods=['POST'])
@login_required
def submit_answer():
    daily_quiz_limit = 10
    utc_now = datetime.datetime.utcnow()
    start_of_day_utc = utc_now.replace(hour=0, minute=0, second=0, microsecond=0)
    daily_attempts = Attempt.query.filter(
        Attempt.user_id == current_user.id,
        Attempt.date_attempted >= start_of_day_utc
    ).count()
    if daily_attempts >= daily_quiz_limit:
        message = f'Daily quiz limit reached ({daily_quiz_limit}/{daily_quiz_limit}). Come back tomorrow for more questions.'
        if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
            return jsonify({'success': False, 'message': message}), 429
        flash(message, 'warning')
        return redirect(url_for('daily_quiz'))

    is_ajax = request.headers.get('X-Requested-With') == 'XMLHttpRequest'
    if is_ajax:
        data = request.get_json() or {}
        question_id = data.get('question_id')
        selected_option = int(data.get('answer', 0))
        start_time = int(data.get('start_time', 0))
        time_taken = (time.time() * 1000 - start_time) / 1000 if start_time else 15.0
        time_taken = max(0.1, min(30, time_taken))
        confidence_level = None  # not sent in AJAX
    else:
        question_id = request.form.get('question_id')
        selected_option = request.form.get('selected_option', type=int)
        time_taken = float(request.form.get('time_taken', 15.0))
        confidence_level = request.form.get('confidence_level', type=int)

    if not question_id or selected_option not in [1,2,3,4]:
        message = 'Please select an option before submitting.'
        if is_ajax:
            return jsonify({'success': False, 'message': message}), 400
        flash(message, 'warning')
        return redirect(url_for('daily_quiz'))
    question = Question.query.get(question_id)
    if not question:
        if is_ajax:
            return jsonify({'success': False, 'message': 'Question not found!'}), 404
        flash('Question not found!', 'danger')
        return redirect(url_for('daily_quiz'))
    existing_attempt = Attempt.query.filter_by(
        user_id=current_user.id,
        question_id=question_id
    ).first()
    if existing_attempt:
        if is_ajax:
            return jsonify({'success': False, 'message': 'You have already attempted this question!'}), 400
        flash('You have already attempted this question!', 'warning')
        return redirect(url_for('daily_quiz'))
    is_correct = (selected_option == question.correct_option)
    
    current_user.update_topic_accuracy(question.topic_id, is_correct)
    
    confidence_level = confidence_level or 0
    attempt = Attempt(
        user_id=current_user.id,
        question_id=question_id,
        selected_option=selected_option,
        is_correct=is_correct,
        time_taken=time_taken,
        streak_bonus_applied=get_streak_multiplier(current_user.current_streak),
        character_present='GIGA',
        character_message_shown='',
        confidence_level=confidence_level,
        hour_of_day=datetime.datetime.now().hour,
        day_of_week=datetime.datetime.now().weekday()
    )
    db.session.add(attempt)
    if is_correct:
        base_points = 10
        streak_multiplier = get_streak_multiplier(current_user.current_streak)
        points_earned = base_points * streak_multiplier
        current_user.points += points_earned
        award_creator_earnings(
            question_id,
            CCE_CREATOR_REWARD_PER_SERVE,
            player_id=current_user.id
        )
        update_question_metrics(question_id, time_taken)
        total_correct = Attempt.query.filter_by(user_id=current_user.id, is_correct=True).count()
        unlocked = get_unlocked_achievement_objects(
            check_achievements(current_user, 'correct_answers', total_correct)
        )
        if time_taken < 3:
            speed_correct = Attempt.query.filter(
                Attempt.user_id == current_user.id,
                Attempt.is_correct == True,
                Attempt.time_taken < 3
            ).count()
            check_achievements(current_user, 'under_3s_answers', speed_correct)
        for achievement in unlocked:
            current_user.add_character_interaction('GIGA', 'achievement_unlocked', {
                'achievement_name': achievement.name
            })
            message = get_giga_message(current_user, 'achievement')
            log_character_interaction(current_user.id, 'GIGA', 'achievement_unlock', message, 'achievement')
            if not is_ajax:
                flash(f'🏆 Achievement Unlocked: {achievement.name}!', 'success')
        if not is_ajax:
            flash(f'Correct answer! You earned {points_earned} points.', 'success')
        
        current_user.add_character_interaction('GIGA', 'quiz_correct_answer', {
            'question_id': question_id,
            'points_earned': points_earned
        })
    else:
        points_earned = 0
        if not is_ajax:
            flash('Wrong answer! Try another question.', 'danger')
        current_user.add_character_interaction('GIGA', 'quiz_incorrect_answer', {
            'question_id': question_id
        })
    total_attempts = Attempt.query.filter_by(user_id=current_user.id).count()
    if total_attempts == 1:
        check_achievements(current_user, 'questions', 1)

    auto_converted = False
    points_converted = 0
    tokens_awarded = 0.0
    completed_daily_quiz = (daily_attempts + 1) >= daily_quiz_limit
    if completed_daily_quiz and not is_ajax:
        flash('Daily quiz complete. Convert points to GEEK from the conversion page.', 'info')

    db.session.commit()

    if is_ajax:
        return jsonify({
            'success': True,
            'is_correct': is_correct,
            'correct_option': question.correct_option,
            'points_earned': points_earned,
            'total_points': current_user.points,
            'total_geek_balance': current_user.geek_balance,
            'completed_daily_quiz': completed_daily_quiz,
            'auto_converted': auto_converted,
            'points_converted': points_converted,
            'tokens_awarded': round(tokens_awarded, 2)
        })

    return redirect(url_for('daily_quiz'))

@app.route('/submit_question', methods=['GET', 'POST'])
@login_required
def submit_question():
    return redirect(url_for('cce_submit_question'))

@app.route('/validate_questions')
@login_required
def validate_questions():
    return redirect(url_for('cce_review_queue'))

@app.route('/validate_question/<int:question_id>/<action>')
@login_required
def validate_question(question_id, action):
    return redirect(url_for('cce_review_queue'))

@app.route('/my_questions')
@login_required
def my_questions():
    return redirect(url_for('cce_my_questions'))

@app.route('/achievements')
@login_required
def achievements():
    user_achievements = UserAchievement.query.filter_by(user_id=current_user.id).all()
    all_achievements = Achievement.query.order_by(Achievement.tier_order.asc(), Achievement.id.asc()).all()

    unlocked_by_achievement_id = {ua.achievement_id: ua for ua in user_achievements}
    correct_answers_count = Attempt.query.filter_by(user_id=current_user.id, is_correct=True).count()
    highest_gauntlet_round = (
        db.session.query(db.func.max(GauntletRun.highest_round))
        .filter_by(user_id=current_user.id)
        .scalar()
        or 0
    )

    progress_by_criteria = {
        'questions': current_user.questions_approved or 0,
        'correct_answers': correct_answers_count,
        'gauntlet_round': highest_gauntlet_round,
        'streak': current_user.current_streak or 0,
        'level': current_user.level or 1,
        'questions_submitted': current_user.questions_submitted or 0,
        'questions_validated': current_user.reviews_completed or 0,
        'reviews_completed': current_user.reviews_completed or 0,
        'cce_earnings': current_user.total_earned_geek or 0.0
    }

    achievements_with_status = []
    for achievement in all_achievements:
        user_progress = progress_by_criteria.get(achievement.criteria_type, 0)
        unlocked_data = unlocked_by_achievement_id.get(achievement.id)
        unlocked = unlocked_data is not None
        progress_pct = 100
        if achievement.criteria_value > 0:
            progress_pct = min((float(user_progress) / float(achievement.criteria_value)) * 100, 100)
        achievements_with_status.append({
            'achievement': achievement,
            'unlocked': unlocked,
            'date_unlocked': unlocked_data.date_unlocked if unlocked_data else None,
            'progress_current': user_progress,
            'progress_target': achievement.criteria_value,
            'progress_pct': progress_pct
        })
    return render_template(
        'achievements.html',
        achievements=achievements_with_status,
        achievements_with_status=achievements_with_status
    )

@app.route('/stickers')
@login_required
def stickers():
    return redirect(url_for('sticker_collection_view'))

@app.route('/open_sticker_pack')
@login_required
def open_sticker_pack():
    first_pack = StickerPack.query.filter_by(user_id=current_user.id, is_opened=False).order_by(StickerPack.created_at.asc()).first()
    if not first_pack:
        flash('No unopened sticker packs yet. Keep playing to earn packs!', 'info')
        return redirect(url_for('sticker_inventory'))
    return redirect(url_for('open_sticker_pack_ritual', pack_id=first_pack.id))

@app.route('/stickers/inventory')
@login_required
def sticker_inventory():
    unopened_packs = StickerPack.query.filter_by(
        user_id=current_user.id,
        is_opened=False
    ).order_by(StickerPack.created_at.desc()).all()
    return render_template('stickers/inventory.html', packs=unopened_packs)

@app.route('/stickers/open_pack/<int:pack_id>', methods=['GET', 'POST'])
@login_required
def open_sticker_pack_ritual(pack_id):
    pack = StickerPack.query.get_or_404(pack_id)
    if pack.user_id != current_user.id:
        abort(403)
    if pack.is_opened:
        flash('This pack has already been opened!', 'warning')
        return redirect(url_for('sticker_inventory'))

    if request.method == 'POST':
        try:
            contents = generate_pack_contents(
                pack_type=pack.pack_type,
                series_id=pack.series_id,
                guaranteed_rarity=pack.guaranteed_rarity
            )

            awarded_stickers = []
            for item in contents:
                sticker_obj = Sticker.query.get(item['sticker_id'])
                if not sticker_obj:
                    continue

                already_owns = UserSticker.query.filter_by(
                    user_id=current_user.id,
                    sticker_id=item['sticker_id'],
                    is_duplicate=False
                ).first()

                is_duplicate = bool(already_owns)
                db.session.add(UserSticker(
                    user_id=current_user.id,
                    sticker_id=item['sticker_id'],
                    is_duplicate=is_duplicate
                ))

                dust_earned = 0
                if is_duplicate:
                    dust_earned = award_dust_for_duplicate(current_user.id, sticker_obj)

                awarded_stickers.append({
                    'id': sticker_obj.id,
                    'name': sticker_obj.name,
                    'rarity': sticker_obj.rarity,
                    'number': sticker_obj.number,
                    'emoji': get_sticker_emoji(sticker_obj.name, sticker_obj.number, sticker_obj.rarity),
                    'is_duplicate': is_duplicate,
                    'dust_value': dust_earned
                })

            pack.is_opened = True
            pack.opened_at = datetime.datetime.utcnow()
            db.session.flush()
            _check_series_completion(current_user, pack.series_id)
            db.session.commit()

            return jsonify({
                'success': True,
                'stickers': awarded_stickers,
                'pack_type': pack.pack_type,
                'remaining_packs': StickerPack.query.filter_by(user_id=current_user.id, is_opened=False).count()
            })
        except Exception as exc:
            db.session.rollback()
            return jsonify({'success': False, 'message': f'Could not open pack: {exc}'}), 500

    return render_template('stickers/pack_opening.html', pack=pack)

@app.route('/stickers/collection')
@login_required
def sticker_collection_view():
    user_sticker_ids = {us.sticker_id for us in UserSticker.query.filter_by(user_id=current_user.id).all()}
    listed_sticker_ids = {
        listing.sticker_id for listing in ExchangeListing.query.filter_by(
            seller_id=current_user.id,
            status='active'
        ).all()
    }
    all_series = StickerSeries.query.filter_by(is_active=True).all()
    collection_data = []
    total_owned = 0
    total_stickers = Sticker.query.count()

    for series in all_series:
        stickers = Sticker.query.filter_by(series_id=series.id).order_by(Sticker.number).all()
        series_owned = 0
        sticker_data = []

        for sticker in stickers:
            owned = sticker.id in user_sticker_ids
            if owned:
                series_owned += 1
                total_owned += 1

            sticker_data.append({
                'id': sticker.id,
                'name': sticker.name if owned else '???',
                'rarity': sticker.rarity if owned else 'unknown',
                'number': sticker.number,
                'owned': owned,
                'listed': owned and (sticker.id in listed_sticker_ids),
                'emoji': get_sticker_emoji(sticker.name, sticker.number, sticker.rarity) if owned else '🔲',
                'dust_value': get_dust_value(sticker.rarity),
                'craft_cost': CRAFTING_COSTS.get(sticker.rarity, 9999)
            })

        completion_pct = (series_owned / len(stickers) * 100) if stickers else 0
        collection_data.append({
            'series': series,
            'stickers': sticker_data,
            'owned': series_owned,
            'total': len(stickers),
            'completion_pct': round(completion_pct, 1),
            'is_complete': bool(stickers) and series_owned == len(stickers)
        })

    overall_pct = (total_owned / total_stickers * 100) if total_stickers else 0
    dust = GeekDust.get_or_create(current_user.id)
    unopened_packs = StickerPack.query.filter_by(user_id=current_user.id, is_opened=False).count()

    return render_template(
        'stickers/collection.html',
        collection_data=collection_data,
        total_owned=total_owned,
        total_stickers=total_stickers,
        overall_pct=round(overall_pct, 1),
        dust=dust,
        unopened_packs=unopened_packs
    )

@app.route('/stickers/craft', methods=['GET', 'POST'])
@login_required
def craft_sticker():
    if request.method == 'POST':
        try:
            payload = request.get_json(silent=True) or {}
            sticker_id = payload.get('sticker_id')
            sticker = Sticker.query.get_or_404(sticker_id)

            already_owns = UserSticker.query.filter_by(
                user_id=current_user.id,
                sticker_id=sticker.id,
                is_duplicate=False
            ).first()
            if already_owns:
                return jsonify({'success': False, 'message': 'You already own this sticker!'}), 400

            cost = CRAFTING_COSTS.get(sticker.rarity, 9999)
            dust = GeekDust.get_or_create(current_user.id)
            if dust.amount < cost:
                return jsonify({'success': False, 'message': f'Not enough Geek Dust! Need {cost}, have {dust.amount}'}), 400

            dust.amount -= cost
            dust.total_spent += cost
            dust.updated_at = datetime.datetime.utcnow()

            db.session.add(UserSticker(
                user_id=current_user.id,
                sticker_id=sticker.id,
                is_duplicate=False
            ))
            db.session.add(DustTransaction(
                user_id=current_user.id,
                amount=-cost,
                reason=f'Crafted: {sticker.name}',
                sticker_id=sticker.id
            ))
            db.session.commit()

            return jsonify({
                'success': True,
                'message': f'Successfully crafted {sticker.name}!',
                'dust_remaining': dust.amount
            })
        except Exception as exc:
            db.session.rollback()
            return jsonify({'success': False, 'message': f'Crafting failed: {exc}'}), 500

    user_sticker_ids = {us.sticker_id for us in UserSticker.query.filter_by(user_id=current_user.id, is_duplicate=False).all()}
    if user_sticker_ids:
        missing_stickers = Sticker.query.filter(~Sticker.id.in_(user_sticker_ids)).order_by(Sticker.rarity, Sticker.number).all()
    else:
        missing_stickers = Sticker.query.order_by(Sticker.rarity, Sticker.number).all()
    dust = GeekDust.get_or_create(current_user.id)
    return render_template(
        'stickers/crafting.html',
        missing_stickers=missing_stickers,
        dust=dust,
        CRAFTING_COSTS=CRAFTING_COSTS
    )

@app.route('/buy_sticker/<int:sticker_id>', methods=['POST'])
@login_required
def buy_sticker(sticker_id):
    sticker = Sticker.query.get_or_404(sticker_id)
    geek_price = get_sticker_geek_cost(sticker.rarity)
    currently_owned = UserSticker.query.filter_by(
        user_id=current_user.id,
        sticker_id=sticker.id,
        is_duplicate=False
    ).first()
    if current_user.geek_balance < geek_price:
        missing = geek_price - current_user.geek_balance
        flash(f'Not enough GEEK. You are short by {missing:.2f} GEEK.', 'warning')
        return redirect(url_for('sticker_shop'))

    try:
        with db.session.begin_nested():
            current_user.geek_balance -= geek_price
            is_duplicate = bool(currently_owned)
            dust_earned = 0
            if is_duplicate:
                dust_earned = get_dust_value(sticker.rarity)
                dust = GeekDust.get_or_create(current_user.id, commit=False)
                dust.amount += dust_earned
                dust.total_earned += dust_earned
                dust.updated_at = datetime.datetime.utcnow()
                db.session.add(DustTransaction(
                    user_id=current_user.id,
                    amount=dust_earned,
                    reason=f'Shop duplicate conversion: {sticker.name}',
                    sticker_id=sticker.id
                ))

            db.session.add(UserSticker(
                user_id=current_user.id,
                sticker_id=sticker.id,
                is_duplicate=is_duplicate
            ))
            db.session.add(StickerPurchaseTransaction(
                buyer_id=current_user.id,
                sticker_id=sticker.id,
                price_geek=geek_price,
                was_duplicate=is_duplicate,
                dust_awarded=dust_earned,
                source='direct_shop'
            ))
        db.session.commit()
    except Exception as exc:
        db.session.rollback()
        flash(f'Purchase failed: {exc}', 'danger')
        return redirect(url_for('sticker_shop'))

    if currently_owned:
        flash(f'Purchased duplicate {sticker.name}. +{dust_earned} dust added.', 'success')
    else:
        flash(f'Purchased {sticker.name} for {geek_price:.2f} GEEK.', 'success')
    return redirect(url_for('sticker_shop'))

@app.route('/stickers/shop')
@login_required
def sticker_shop():
    owned_ids = {row.sticker_id for row in UserSticker.query.filter_by(user_id=current_user.id, is_duplicate=False).all()}
    rarity = (request.args.get('rarity') or '').strip().lower()
    series_id = request.args.get('series_id', type=int)
    ownership = (request.args.get('ownership') or 'all').strip().lower()
    min_price = request.args.get('min_price', type=float)
    max_price = request.args.get('max_price', type=float)
    sort_by = (request.args.get('sort') or 'price_asc').strip().lower()
    q = (request.args.get('q') or '').strip().lower()

    stickers_query = Sticker.query
    if rarity:
        stickers_query = stickers_query.filter(Sticker.rarity == rarity)
    if series_id:
        stickers_query = stickers_query.filter(Sticker.series_id == series_id)
    if q:
        stickers_query = stickers_query.filter(Sticker.name.ilike(f'%{q}%'))

    stickers = stickers_query.all()
    rows = []
    for sticker in stickers:
        price = get_sticker_geek_cost(sticker.rarity)
        owned = sticker.id in owned_ids
        if ownership == 'owned' and not owned:
            continue
        if ownership == 'missing' and owned:
            continue
        if min_price is not None and price < min_price:
            continue
        if max_price is not None and price > max_price:
            continue
        deficit = max(0.0, price - float(current_user.geek_balance or 0.0))
        rows.append({
            'sticker': sticker,
            'price': round(price, 2),
            'owned': owned,
            'affordable': deficit <= 0.0,
            'deficit': round(deficit, 2),
            'dust_value': get_dust_value(sticker.rarity)
        })

    rarity_rank = {'common': 1, 'uncommon': 2, 'rare': 3, 'epic': 4, 'legendary': 5}
    if sort_by == 'price_desc':
        rows.sort(key=lambda x: x['price'], reverse=True)
    elif sort_by == 'rarity':
        rows.sort(key=lambda x: (rarity_rank.get((x['sticker'].rarity or '').lower(), 99), x['sticker'].number))
    elif sort_by == 'series':
        rows.sort(key=lambda x: ((x['sticker'].series.name if x['sticker'].series else ''), x['sticker'].number))
    else:
        rows.sort(key=lambda x: x['price'])

    purchase_history = StickerPurchaseTransaction.query.filter_by(buyer_id=current_user.id).order_by(
        StickerPurchaseTransaction.created_at.desc()
    ).limit(100).all()

    return render_template(
        'stickers/shop.html',
        rows=rows,
        series=StickerSeries.query.filter_by(is_active=True).all(),
        current_balance=round(float(current_user.geek_balance or 0.0), 2),
        filters={
            'rarity': rarity,
            'series_id': series_id,
            'ownership': ownership,
            'min_price': min_price,
            'max_price': max_price,
            'sort': sort_by,
            'q': q
        },
        purchase_history=purchase_history
    )

@app.route('/stickers/exchange')
@login_required
def sticker_exchange():
    active_listings = ExchangeListing.query.filter(ExchangeListing.status == 'active').order_by(ExchangeListing.created_at.desc()).all()
    my_active_listings = ExchangeListing.query.filter_by(seller_id=current_user.id, status='active').order_by(ExchangeListing.created_at.desc()).all()
    my_offers = ExchangeOffer.query.filter_by(offerer_id=current_user.id).order_by(ExchangeOffer.created_at.desc()).limit(100).all()
    incoming_offers = ExchangeOffer.query.join(ExchangeListing, ExchangeListing.id == ExchangeOffer.listing_id).filter(
        ExchangeListing.seller_id == current_user.id
    ).order_by(ExchangeOffer.created_at.desc()).limit(100).all()
    history = ExchangeTransaction.query.filter(
        db.or_(ExchangeTransaction.seller_id == current_user.id, ExchangeTransaction.buyer_id == current_user.id)
    ).order_by(ExchangeTransaction.created_at.desc()).limit(150).all()

    my_stickers = UserSticker.query.filter_by(user_id=current_user.id).order_by(UserSticker.date_acquired.desc()).limit(500).all()
    my_unlisted_for_exchange = []
    listed_ids = {l.seller_user_sticker_id for l in my_active_listings}
    for us in my_stickers:
        if us.id not in listed_ids:
            my_unlisted_for_exchange.append(us)

    return render_template(
        'stickers/exchange.html',
        active_listings=active_listings,
        my_active_listings=my_active_listings,
        my_unlisted_for_exchange=my_unlisted_for_exchange,
        my_offers=my_offers,
        incoming_offers=incoming_offers,
        history=history,
        current_balance=round(float(current_user.geek_balance or 0.0), 2)
    )

@app.route('/stickers/exchange/list', methods=['POST'])
@login_required
def create_exchange_listing():
    seller_user_sticker_id = request.form.get('user_sticker_id', type=int)
    ask_price = request.form.get('ask_price_geek', type=float)
    requested_ids_raw = (request.form.get('requested_sticker_ids') or '').strip()
    if not seller_user_sticker_id:
        flash('Choose a sticker to list.', 'warning')
        return redirect(url_for('sticker_exchange'))

    seller_item = UserSticker.query.get_or_404(seller_user_sticker_id)
    if seller_item.user_id != current_user.id:
        abort(403)

    already_listed = ExchangeListing.query.filter_by(
        seller_user_sticker_id=seller_item.id,
        status='active'
    ).first()
    if already_listed:
        flash('That sticker is already listed.', 'warning')
        return redirect(url_for('sticker_exchange'))

    requested_ids = []
    if requested_ids_raw:
        for part in requested_ids_raw.split(','):
            part = part.strip()
            if part.isdigit():
                requested_ids.append(int(part))

    config = get_economy_config()
    expires_at = datetime.datetime.utcnow() + datetime.timedelta(hours=max(1, config.exchange_listing_expiry_hours))
    db.session.add(ExchangeListing(
        seller_id=current_user.id,
        seller_user_sticker_id=seller_item.id,
        sticker_id=seller_item.sticker_id,
        ask_price_geek=ask_price if ask_price and ask_price > 0 else None,
        requested_sticker_ids_json=list_to_json(requested_ids),
        status='active',
        expires_at=expires_at
    ))
    db.session.commit()
    flash('Listing created.', 'success')
    return redirect(url_for('sticker_exchange'))

@app.route('/stickers/exchange/cancel/<int:listing_id>', methods=['POST'])
@login_required
def cancel_exchange_listing(listing_id):
    listing = ExchangeListing.query.get_or_404(listing_id)
    if listing.seller_id != current_user.id:
        abort(403)
    if listing.status != 'active':
        flash('Listing is no longer active.', 'warning')
        return redirect(url_for('sticker_exchange'))
    listing.status = 'cancelled'
    listing.cancelled_at = datetime.datetime.utcnow()
    pending = ExchangeOffer.query.filter_by(listing_id=listing.id, status='pending').all()
    for offer in pending:
        offer.status = 'cancelled'
        offer.responded_at = datetime.datetime.utcnow()
    db.session.commit()
    flash('Listing cancelled.', 'success')
    return redirect(url_for('sticker_exchange'))

@app.route('/stickers/exchange/buy/<int:listing_id>', methods=['POST'])
@login_required
def buy_exchange_listing(listing_id):
    listing = ExchangeListing.query.get_or_404(listing_id)
    if listing.status != 'active':
        flash('Listing is no longer active.', 'warning')
        return redirect(url_for('sticker_exchange'))
    if listing.seller_id == current_user.id:
        flash('You cannot buy your own listing.', 'warning')
        return redirect(url_for('sticker_exchange'))
    if not listing.ask_price_geek or listing.ask_price_geek <= 0:
        flash('This listing does not accept direct GEEK purchase.', 'warning')
        return redirect(url_for('sticker_exchange'))
    if current_user.geek_balance < listing.ask_price_geek:
        flash('Not enough GEEK balance.', 'warning')
        return redirect(url_for('sticker_exchange'))

    seller = User.query.get(listing.seller_id)
    listed_item = UserSticker.query.get(listing.seller_user_sticker_id)
    if not seller or not listed_item or listed_item.user_id != seller.id:
        flash('Listing is invalid.', 'danger')
        return redirect(url_for('sticker_exchange'))

    try:
        with db.session.begin_nested():
            current_user.geek_balance -= listing.ask_price_geek
            seller.geek_balance += listing.ask_price_geek
            buyer_already_owns_primary = UserSticker.query.filter_by(
                user_id=current_user.id,
                sticker_id=listed_item.sticker_id,
                is_duplicate=False
            ).first()
            listed_item.user_id = current_user.id
            listed_item.is_duplicate = bool(buyer_already_owns_primary)
            listed_item.date_acquired = datetime.datetime.utcnow()

            listing.status = 'completed'
            listing.completed_at = datetime.datetime.utcnow()
            listing.completed_by_id = current_user.id

            for offer in ExchangeOffer.query.filter_by(listing_id=listing.id, status='pending').all():
                offer.status = 'declined'
                offer.responded_at = datetime.datetime.utcnow()

            db.session.add(ExchangeTransaction(
                listing_id=listing.id,
                seller_id=seller.id,
                buyer_id=current_user.id,
                tx_type='sale',
                geek_amount=listing.ask_price_geek,
                seller_sticker_id=listing.sticker_id,
                buyer_sticker_ids_json=list_to_json([])
            ))
            notify_user(
                seller.id,
                'Sticker Sold',
                f'Your listing sold for {listing.ask_price_geek:.2f} GEEK.'
            )
            notify_user(
                current_user.id,
                'Sticker Purchased',
                f'You bought sticker #{listing.sticker_id} for {listing.ask_price_geek:.2f} GEEK.'
            )
        db.session.commit()
    except Exception as exc:
        db.session.rollback()
        flash(f'Purchase failed: {exc}', 'danger')
        return redirect(url_for('sticker_exchange'))

    flash('Exchange purchase completed.', 'success')
    return redirect(url_for('sticker_exchange'))

@app.route('/stickers/exchange/offer/<int:listing_id>', methods=['POST'])
@login_required
def create_exchange_offer(listing_id):
    listing = ExchangeListing.query.get_or_404(listing_id)
    if listing.status != 'active':
        flash('Listing is no longer active.', 'warning')
        return redirect(url_for('sticker_exchange'))
    if listing.seller_id == current_user.id:
        flash('You cannot offer on your own listing.', 'warning')
        return redirect(url_for('sticker_exchange'))

    offered_user_sticker_ids = request.form.getlist('offered_user_sticker_ids')
    offered_ids = []
    for raw in offered_user_sticker_ids:
        try:
            offered_ids.append(int(raw))
        except Exception:
            continue
    if not offered_ids:
        flash('Select at least one sticker to offer.', 'warning')
        return redirect(url_for('sticker_exchange'))

    for usid in offered_ids:
        us = UserSticker.query.get(usid)
        if not us or us.user_id != current_user.id:
            flash('Offer contains invalid stickers.', 'danger')
            return redirect(url_for('sticker_exchange'))

    db.session.add(ExchangeOffer(
        listing_id=listing.id,
        offerer_id=current_user.id,
        offered_user_sticker_ids_json=list_to_json(offered_ids),
        note=(request.form.get('note') or '').strip()[:300],
        status='pending'
    ))
    notify_user(
        listing.seller_id,
        'New Trade Offer',
        f'{current_user.username} sent a trade offer on your listing #{listing.id}.'
    )
    db.session.commit()
    flash('Offer submitted.', 'success')
    return redirect(url_for('sticker_exchange'))

@app.route('/stickers/exchange/offer/<int:offer_id>/accept', methods=['POST'])
@login_required
def accept_exchange_offer(offer_id):
    offer = ExchangeOffer.query.get_or_404(offer_id)
    listing = ExchangeListing.query.get_or_404(offer.listing_id)
    if listing.seller_id != current_user.id:
        abort(403)
    if listing.status != 'active' or offer.status != 'pending':
        flash('Offer or listing is no longer active.', 'warning')
        return redirect(url_for('sticker_exchange'))

    listed_item = UserSticker.query.get(listing.seller_user_sticker_id)
    offered_ids = json_to_int_list(offer.offered_user_sticker_ids_json)
    offered_items = UserSticker.query.filter(UserSticker.id.in_(offered_ids)).all() if offered_ids else []
    if not listed_item or listed_item.user_id != current_user.id:
        flash('Listing sticker no longer available.', 'danger')
        return redirect(url_for('sticker_exchange'))
    if len(offered_items) != len(offered_ids) or any(item.user_id != offer.offerer_id for item in offered_items):
        flash('Offer is invalid.', 'danger')
        return redirect(url_for('sticker_exchange'))

    buyer = User.query.get(offer.offerer_id)
    try:
        with db.session.begin_nested():
            buyer_has_primary = UserSticker.query.filter_by(
                user_id=buyer.id,
                sticker_id=listed_item.sticker_id,
                is_duplicate=False
            ).first()
            listed_item.user_id = buyer.id
            listed_item.is_duplicate = bool(buyer_has_primary)
            listed_item.date_acquired = datetime.datetime.utcnow()

            received_sticker_ids = []
            for item in offered_items:
                seller_has_primary_for_item = UserSticker.query.filter_by(
                    user_id=current_user.id,
                    sticker_id=item.sticker_id,
                    is_duplicate=False
                ).first()
                item.user_id = current_user.id
                item.is_duplicate = bool(seller_has_primary_for_item)
                item.date_acquired = datetime.datetime.utcnow()
                received_sticker_ids.append(item.sticker_id)

            listing.status = 'completed'
            listing.completed_at = datetime.datetime.utcnow()
            listing.completed_by_id = buyer.id
            offer.status = 'accepted'
            offer.responded_at = datetime.datetime.utcnow()
            for other in ExchangeOffer.query.filter(
                ExchangeOffer.listing_id == listing.id,
                ExchangeOffer.id != offer.id,
                ExchangeOffer.status == 'pending'
            ).all():
                other.status = 'declined'
                other.responded_at = datetime.datetime.utcnow()

            db.session.add(ExchangeTransaction(
                listing_id=listing.id,
                seller_id=current_user.id,
                buyer_id=buyer.id,
                tx_type='trade',
                geek_amount=0.0,
                seller_sticker_id=listing.sticker_id,
                buyer_sticker_ids_json=list_to_json(received_sticker_ids)
            ))
            notify_user(
                current_user.id,
                'Trade Completed',
                f'You traded sticker #{listing.sticker_id} and received {len(received_sticker_ids)} sticker(s).'
            )
            notify_user(
                buyer.id,
                'Trade Completed',
                f'Your trade offer was accepted for listing #{listing.id}.'
            )
        db.session.commit()
    except Exception as exc:
        db.session.rollback()
        flash(f'Trade failed: {exc}', 'danger')
        return redirect(url_for('sticker_exchange'))

    flash('Trade completed.', 'success')
    return redirect(url_for('sticker_exchange'))

@app.route('/stickers/exchange/offer/<int:offer_id>/decline', methods=['POST'])
@login_required
def decline_exchange_offer(offer_id):
    offer = ExchangeOffer.query.get_or_404(offer_id)
    listing = ExchangeListing.query.get_or_404(offer.listing_id)
    if listing.seller_id != current_user.id:
        abort(403)
    if offer.status != 'pending':
        flash('Offer already handled.', 'warning')
        return redirect(url_for('sticker_exchange'))
    offer.status = 'declined'
    offer.responded_at = datetime.datetime.utcnow()
    notify_user(
        offer.offerer_id,
        'Trade Offer Declined',
        f'Your offer on listing #{listing.id} was declined.'
    )
    db.session.commit()
    flash('Offer declined.', 'success')
    return redirect(url_for('sticker_exchange'))

@app.route('/points/convert', methods=['GET', 'POST'])
@login_required
def points_convert():
    config = get_economy_config()
    if request.method == 'POST':
        points_to_convert = request.form.get('points_to_convert', type=int)
        if not points_to_convert or points_to_convert <= 0:
            flash('Enter a valid points amount.', 'warning')
            return redirect(url_for('points_convert'))
        current_config = get_economy_config()
        if points_to_convert < current_config.minimum_points:
            flash(f'Minimum conversion is {current_config.minimum_points} points.', 'warning')
            return redirect(url_for('points_convert'))
        if points_to_convert > current_user.points:
            flash('You cannot convert more points than your balance.', 'warning')
            return redirect(url_for('points_convert'))

        geek_received = points_to_convert / float(current_config.points_per_geek)
        try:
            with db.session.begin_nested():
                current_user.points -= points_to_convert
                current_user.geek_balance += geek_received
                db.session.add(PointsConversionTransaction(
                    user_id=current_user.id,
                    points_spent=points_to_convert,
                    geek_received=geek_received,
                    rate_points_per_geek=current_config.points_per_geek
                ))
            db.session.commit()
        except Exception as exc:
            db.session.rollback()
            flash(f'Conversion failed: {exc}', 'danger')
            return redirect(url_for('points_convert'))

        if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
            return jsonify({
                'success': True,
                'points': int(current_user.points or 0),
                'geek_balance': round(float(current_user.geek_balance or 0.0), 2),
                'geek_received': round(float(geek_received), 2)
            })

        flash(f'Converted {points_to_convert} points into {geek_received:.2f} GEEK.', 'success')
        return redirect(url_for('points_convert'))

    history = PointsConversionTransaction.query.filter_by(user_id=current_user.id).order_by(
        PointsConversionTransaction.created_at.desc()
    ).limit(200).all()
    return render_template(
        'points_convert.html',
        config=config,
        history=history
    )

@app.route('/level_progression')
@login_required
def level_progression():
    """Enhanced level progression page with stage visualization"""
    levels = get_level_progression()
    
    stage_stats = []
    for stage in LEVEL_STAGES:
        min_level, max_level = stage['range']
        stage_levels = [l for l in levels if min_level <= l['level'] <= max_level]
        
        if stage_levels:
            xp_required_min = stage_levels[0]['xp_required']
            xp_required_max = stage_levels[-1]['xp_required']
            xp_range = xp_required_max - xp_required_min
            
            stage_stats.append({
                'stage': stage,
                'min_level': min_level,
                'max_level': max_level,
                'xp_range': xp_range,
                'level_count': len(stage_levels),
                'is_current': min_level <= current_user.level <= max_level
            })
    
    milestone_rewards = {}
    for i in range(10, 101, 10):
        milestone_rewards[i] = current_user.get_milestone_reward(i)
    
    return render_template('level_progression.html',
                         levels=levels,
                         current_level=current_user.level,
                         stage_stats=stage_stats,
                         milestone_rewards=milestone_rewards,
                         get_level_stage=get_level_stage)

@app.route('/topics')
@login_required
def topics():
    all_topics = Topic.query.filter_by(is_active=True).all()
    selected_topics = get_user_topics_preferences(current_user.id)
    return render_template('topics.html',
                         topics=all_topics,
                         selected_topics=selected_topics)

@app.route('/admin')
@login_required
def admin_panel():
    if not current_user.is_admin:
        flash('Access denied! Admin privileges required.', 'danger')
        return redirect(url_for('dashboard'))
    pending_questions = Question.query.filter_by(status='pending').all()
    users = User.query.all()
    topics = Topic.query.all()
    cce_stats = {
        'total_questions': Question.query.count(),
        'pending_questions': len(pending_questions),
        'approved_questions': Question.query.filter_by(status='approved').count(),
        'total_creators': User.query.filter(User.questions_submitted > 0).count(),
        'total_reviewers': User.query.filter(User.reviews_completed > 0).count(),
        'total_geek_distributed': db.session.query(db.func.sum(CreatorEarning.amount)).scalar() or 0,
        'total_review_rewards': db.session.query(db.func.sum(QuestionValidation.geek_awarded)).scalar() or 0
    }
    economy_config = get_economy_config()
    recent_point_conversions = PointsConversionTransaction.query.order_by(
        PointsConversionTransaction.created_at.desc()
    ).all()
    recent_exchange_transactions = ExchangeTransaction.query.order_by(
        ExchangeTransaction.created_at.desc()
    ).all()
    recent_sticker_purchases = StickerPurchaseTransaction.query.order_by(
        StickerPurchaseTransaction.created_at.desc()
    ).all()
    return render_template('admin.html',
                         questions=pending_questions,
                         users=users,
                         topics=topics,
                         cce_stats=cce_stats,
                         economy_config=economy_config,
                         recent_point_conversions=recent_point_conversions,
                         recent_exchange_transactions=recent_exchange_transactions,
                         recent_sticker_purchases=recent_sticker_purchases)

@app.route('/admin/approve_question/<int:question_id>')
@login_required
def approve_question(question_id):
    if not current_user.is_admin:
        flash('Access denied!', 'danger')
        return redirect(url_for('dashboard'))
    question = Question.query.get(question_id)
    if question:
        question.status = 'approved'
        question.approved_by = current_user.id
        question.date_approved = datetime.datetime.utcnow()
        award_question_creation_points(question.created_by, question_id)
        db.session.commit()
        flash('Question approved! Creator earned 10 points.', 'success')
    else:
        flash('Question not found!', 'danger')
    return redirect(url_for('admin_panel'))

@app.route('/admin/reject_question/<int:question_id>')
@login_required
def reject_question(question_id):
    if not current_user.is_admin:
        flash('Access denied!', 'danger')
        return redirect(url_for('dashboard'))
    question = Question.query.get(question_id)
    if question:
        question.status = 'rejected'
        question.approved_by = current_user.id
        creator = User.query.get(question.created_by)
        creator.questions_rejected += 1
        db.session.commit()
        flash('Question rejected!', 'success')
    else:
        flash('Question not found!', 'danger')
    return redirect(url_for('admin_panel'))

@app.route('/admin/promote_user/<int:user_id>')
@login_required
def promote_user(user_id):
    if not current_user.is_admin:
        flash('Access denied!', 'danger')
        return redirect(url_for('dashboard'))
    user = User.query.get(user_id)
    if user:
        user.role = 'validator'
        db.session.commit()
        flash(f'User {user.email} promoted to validator!', 'success')
    else:
        flash('User not found!', 'danger')
    return redirect(url_for('admin_panel'))

@app.route('/admin/demote_user/<int:user_id>')
@login_required
def demote_user(user_id):
    if not current_user.is_admin:
        flash('Access denied!', 'danger')
        return redirect(url_for('dashboard'))
    user = User.query.get(user_id)
    if user and user.id != current_user.id:
        user.role = 'player'
        db.session.commit()
        flash(f'User {user.email} demoted to player!', 'success')
    else:
        flash('User not found or cannot demote yourself!', 'danger')
    return redirect(url_for('admin_panel'))

@app.route('/admin/add_question', methods=['POST'])
@login_required
def add_question():
    if not current_user.is_admin:
        flash('Access denied!', 'danger')
        return redirect(url_for('dashboard'))
    question_text = request.form.get('question')
    option1 = request.form.get('option1')
    option2 = request.form.get('option2')
    option3 = request.form.get('option3')
    option4 = request.form.get('option4')
    correct_option = int(request.form.get('correct_option'))
    difficulty = request.form.get('difficulty', 'easy')
    topic_id = int(request.form.get('topic_id'))
    subtopic = request.form.get('subtopic', '')
    fun_fact = request.form.get('fun_fact', '')
    
    question = Question(
        question=question_text,
        option1=option1,
        option2=option2,
        option3=option3,
        option4=option4,
        correct_option=correct_option,
        difficulty=difficulty,
        topic_id=topic_id,
        created_by=current_user.id,
        subtopic=subtopic if subtopic else None,
        fun_fact=fun_fact if fun_fact else None,
        status='approved',
        approved_by=current_user.id,
        date_approved=datetime.datetime.utcnow()
    )
    db.session.add(question)
    db.session.commit()
    flash('Question added successfully!', 'success')
    return redirect(url_for('admin_panel'))

@app.route('/admin/add_topic', methods=['POST'])
@login_required
def add_topic():
    if not current_user.is_admin:
        flash('Access denied!', 'danger')
        return redirect(url_for('dashboard'))
    name = request.form.get('name')
    description = request.form.get('description')
    icon = request.form.get('icon', 'default.png')
    if Topic.query.filter_by(name=name).first():
        flash('Topic already exists!', 'danger')
        return redirect(url_for('admin_panel'))
    topic = Topic(
        name=name,
        description=description,
        icon=icon
    )
    db.session.add(topic)
    db.session.commit()
    flash('Topic added successfully!', 'success')
    return redirect(url_for('admin_panel'))

@app.route('/admin/update_economy', methods=['POST'])
@login_required
def admin_update_economy():
    if not current_user.is_admin:
        flash('Access denied!', 'danger')
        return redirect(url_for('dashboard'))

    points_per_geek = request.form.get('points_per_geek', type=int)
    minimum_points = request.form.get('minimum_points', type=int)
    expiry_hours = request.form.get('exchange_listing_expiry_hours', type=int)
    if not points_per_geek or points_per_geek <= 0:
        flash('points_per_geek must be a positive integer.', 'danger')
        return redirect(url_for('admin_panel'))
    if not minimum_points or minimum_points <= 0:
        flash('minimum_points must be a positive integer.', 'danger')
        return redirect(url_for('admin_panel'))
    if not expiry_hours or expiry_hours <= 0:
        flash('exchange_listing_expiry_hours must be a positive integer.', 'danger')
        return redirect(url_for('admin_panel'))

    config = get_economy_config()
    config.points_per_geek = points_per_geek
    config.minimum_points = minimum_points
    config.exchange_listing_expiry_hours = expiry_hours
    config.updated_at = datetime.datetime.utcnow()
    db.session.commit()
    flash('Economy settings updated.', 'success')
    return redirect(url_for('admin_panel'))

@app.route('/redeem_rewards', methods=['POST'])
@login_required
def redeem_rewards():
    flash('Use the points conversion page to convert a specific points amount.', 'info')
    return redirect(url_for('points_convert'))

@app.route('/debug/questions')
@login_required
def debug_questions():
    if not current_user.is_admin:
        flash('Admin access required', 'danger')
        return redirect(url_for('dashboard'))
    pending_count = Question.query.filter_by(status='pending').count()
    approved_count = Question.query.filter_by(status='approved').count()
    rejected_count = Question.query.filter_by(status='rejected').count()
    total_count = Question.query.count()
    difficulties = db.session.query(Question.difficulty, db.func.count(Question.id)).group_by(Question.difficulty).all()
    topics = db.session.query(Topic.name, db.func.count(Question.id))\
        .join(Question)\
        .group_by(Topic.name)\
        .all()
    cce_stats = {
        'questions_in_review_queue': ReviewQueue.query.count(),
        'questions_with_earnings': Question.query.filter(Question.total_earned > 0).count(),
        'questions_at_max_earnings': Question.query.filter(Question.total_earned >= CCE_MAX_EARNINGS_PER_QUESTION).count(),
        'avg_approval_time': db.session.query(
            db.func.avg(db.func.julianday(Question.date_approved) - db.func.julianday(Question.date_created))
        ).filter(Question.date_approved.isnot(None)).scalar() or 0,
        'avg_serves_per_question': db.session.query(db.func.avg(Question.total_serves)).scalar() or 0
    }
    return render_template('debug_questions.html',
                         pending_count=pending_count,
                         approved_count=approved_count,
                         rejected_count=rejected_count,
                         total_count=total_count,
                         difficulties=difficulties,
                         topics=topics,
                         cce_stats=cce_stats)

@app.route('/character_interactions')
@login_required
def character_interactions():
    """View all character interactions for the current user"""
    interactions = CharacterInteraction.query.filter_by(user_id=current_user.id)\
        .order_by(CharacterInteraction.timestamp.desc()).all()
    week_ago = datetime.datetime.utcnow() - datetime.timedelta(days=7)
    
    giga_interactions = [i for i in interactions if i.character == 'GIGA']
    ace_interactions = [i for i in interactions if i.character == 'ACE']
    
    total_interactions = len(interactions)
    giga_count = len(giga_interactions)
    ace_count = len(ace_interactions)
    
    return render_template('character_interactions.html',
                         interactions=interactions,
                         giga_interactions=giga_interactions[:10],
                         ace_interactions=ace_interactions[:10],
                         total_interactions=total_interactions,
                         giga_count=giga_count,
                         ace_count=ace_count,
                         giga_affinity=current_user.character_affinity_giga,
                         ace_affinity=current_user.character_affinity_ace,
                         week_ago=week_ago)

@app.route('/set_favorite_character', methods=['POST'])
@login_required
def set_favorite_character():
    """Allow user to set their favorite character"""
    character = request.form.get('character')
    if character not in ['GIGA', 'ACE']:
        flash('Invalid character selection!', 'danger')
        return redirect(url_for('dashboard'))
    
    current_user.favorite_character = character
    db.session.commit()
    
    if character == 'GIGA':
        message = "Thank you for choosing me as your favorite! I'll be here to support you every step of the way! 🌟"
        current_user.add_character_interaction('GIGA', 'favorite_set', {'character': character})
    else:
        message = "Favorite status acknowledged. I will continue to provide rigorous intellectual challenges. Assessment protocols ready."
        current_user.add_character_interaction('ACE', 'favorite_set', {'character': character})
    
    flash(f'Favorite character set to {character}!', 'success')
    return redirect(url_for('dashboard'))

@app.route('/api/get_character_message', methods=['POST'])
@login_required
def api_get_character_message():
    """API endpoint to get character messages (for AJAX)"""
    character = request.json.get('character')
    context = request.json.get('context')
    
    if character not in ['GIGA', 'ACE']:
        return jsonify({'success': False, 'message': 'Invalid character'})
    
    if character == 'GIGA':
        message = get_giga_message(current_user, context)
    else:
        message = get_ace_message(current_user, context)
    
    log_character_interaction(current_user.id, character, 'api_request', message, context)
    current_user.add_character_interaction(character, 'message_request', {'context': context})
    
    return jsonify({'success': True, 'message': message})

@app.route('/character_stats')
@login_required
def character_stats():
    """View detailed character statistics"""
    attempts = Attempt.query.filter_by(user_id=current_user.id).all()
    
    giga_attempts = [a for a in attempts if a.character_present == 'GIGA']
    ace_attempts = [a for a in attempts if a.character_present == 'ACE']
    
    giga_correct = len([a for a in giga_attempts if a.is_correct])
    ace_correct = len([a for a in ace_attempts if a.is_correct])
    
    giga_accuracy = (giga_correct / len(giga_attempts) * 100) if giga_attempts else 0
    ace_accuracy = (ace_correct / len(ace_attempts) * 100) if ace_attempts else 0
    
    interactions = current_user.get_character_interactions()
    
    today = datetime.datetime.utcnow().date()
    week_ago = today - datetime.timedelta(days=7)
    
    recent_giga = len([i for i in interactions 
                       if i.get('character') == 'GIGA' 
                       and datetime.datetime.fromisoformat(i.get('timestamp', '')).date() >= week_ago])
    
    recent_ace = len([i for i in interactions 
                      if i.get('character') == 'ACE' 
                      and datetime.datetime.fromisoformat(i.get('timestamp', '')).date() >= week_ago])
    
    ai_rec_count = AIRecommendation.query.filter_by(user_id=current_user.id).count()
    
    stats = {
        'giga': {
            'attempts': len(giga_attempts),
            'correct': giga_correct,
            'accuracy': round(giga_accuracy, 1),
            'affinity': round(current_user.character_affinity_giga, 1),
            'recent_interactions': recent_giga,
            'favorite': current_user.favorite_character == 'GIGA'
        },
        'ace': {
            'attempts': len(ace_attempts),
            'correct': ace_correct,
            'accuracy': round(ace_accuracy, 1),
            'affinity': round(current_user.character_affinity_ace, 1),
            'recent_interactions': recent_ace,
            'favorite': current_user.favorite_character == 'ACE'
        },
        'ai': {
            'total_recommendations': ai_rec_count,
            'total_character_interactions': len(interactions)
        }
    }
    
    return render_template('character_stats.html', stats=stats)

@app.route('/ai_assistant')
@login_required
def ai_assistant():
    """AI Assistant hub page"""
    weak_topics = current_user.get_weak_topics(threshold=60)
    weak_cats_info = []
    for weak in weak_topics[:5]:
        cat = Topic.query.get(weak['topic_id'])
        if cat:
            weak_cats_info.append({
                'id': cat.id,
                'name': cat.name,
                'accuracy': weak['accuracy'],
                'attempts': weak['attempts']
            })
    
    strong_topics = current_user.get_strong_topics(threshold=80)
    strong_cats_info = []
    for strong in strong_topics[:5]:
        cat = Topic.query.get(strong['topic_id'])
        if cat:
            strong_cats_info.append({
                'id': cat.id,
                'name': cat.name,
                'accuracy': strong['accuracy']
            })
    
    recent_recommendations = AIRecommendation.query.filter_by(user_id=current_user.id)\
        .order_by(AIRecommendation.timestamp.desc()).limit(10).all()
    
    domains = []
    for key, domain in AI_KNOWLEDGE.get('knowledge_domains', {}).items():
        domains.append({
            'name': domain.get('name', ''),
            'emoji': domain.get('emoji', ''),
            'topics': domain.get('core_topics', [])[:3]
        })
    
    return render_template('ai_assistant.html',
                         weak_topics=weak_cats_info,
                         strong_topics=strong_cats_info,
                         recent_recommendations=recent_recommendations,
                         domains=domains[:6],
                         ai_knowledge_version=AI_KNOWLEDGE.get('version', '1.0'))

# ==================== DATABASE INITIALIZATION ====================

def _get_columns(table_name):
    inspector = inspect(db.engine)
    return {col['name'] for col in inspector.get_columns(table_name)}

def _ensure_column(table_name, column_name, sql_type, default_sql=None):
    cols = _get_columns(table_name)
    if column_name in cols:
        return
    default_clause = f" DEFAULT {default_sql}" if default_sql is not None else ""
    db.session.execute(text(f"ALTER TABLE {table_name} ADD COLUMN {column_name} {sql_type}{default_clause}"))
    db.session.commit()

def ensure_runtime_schema():
    db.create_all()
    _ensure_column('achievement', 'tier', 'VARCHAR(20)', "'bronze'")
    _ensure_column('achievement', 'tier_order', 'INTEGER', "1")
    _ensure_column('achievement', 'track_name', 'VARCHAR(100)')
    _ensure_column('achievement', 'is_hidden', 'VARCHAR(5)', "'false'")
    _ensure_column('achievement', 'is_secret', 'BOOLEAN', "0")
    _ensure_column('achievement', 'prerequisite_achievement_id', 'INTEGER')
    _ensure_column('achievement', 'unlock_animation', 'VARCHAR(50)', "'standard'")
    _ensure_column('achievement', 'geek_reward', 'FLOAT', "0.0")
    _ensure_column('achievement', 'xp_reward', 'INTEGER', "0")
    _ensure_column('achievement', 'sticker_pack_reward', 'INTEGER', "0")

    _ensure_column('user_achievement', 'tier_reached', 'VARCHAR(20)', "'bronze'")
    _ensure_column('user_achievement', 'was_hidden', 'BOOLEAN', "0")
    _ensure_column('user_achievement', 'notification_shown', 'BOOLEAN', "0")
    _ensure_column('gauntlet_run', 'active_round', 'INTEGER')
    _ensure_column('gauntlet_run', 'active_state', 'TEXT')
    _ensure_column('gauntlet_run', 'active_state_updated_at', 'DATETIME')

def ensure_crafting_recipes():
    for rarity, dust_cost in CRAFTING_COSTS.items():
        row = CraftingRecipe.query.filter_by(rarity=rarity).first()
        if not row:
            db.session.add(CraftingRecipe(rarity=rarity, dust_cost=dust_cost))
        else:
            row.dust_cost = dust_cost
    db.session.commit()

def extract_sample_question_topic_names():
    """Parse sample_questions.py and extract topic names used in topic_map lookups."""
    file_path = os.path.join(os.path.dirname(__file__), 'sample_questions.py')
    if not os.path.exists(file_path):
        return set()
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    direct_keys = set(re.findall(r'topic_map\["([^"]+)"\]', content))
    get_keys = set(re.findall(r'topic_map\.get\("([^"]+)"', content))
    return direct_keys | get_keys

def init_db():
    with app.app_context():
        ensure_runtime_schema()
        
        # Create all new word challenge tables
        try:
            WordChallenge.query.first()
            print("WordChallenge table exists")
        except:
            print("WordChallenge table will be created")
        
        try:
            WordChallengePlayer.query.first()
            print("WordChallengePlayer table exists")
        except:
            print("WordChallengePlayer table will be created")
        
        try:
            WordChallengeMove.query.first()
            print("WordChallengeMove table exists")
        except:
            print("WordChallengeMove table will be created")
        
        try:
            WordChallengeChat.query.first()
            print("WordChallengeChat table exists")
        except:
            print("WordChallengeChat table will be created")
        
        try:
            WordChallengeInvite.query.first()
            print("WordChallengeInvite table exists")
        except:
            print("WordChallengeInvite table will be created")
        
        try:
            WordChallengeDailyChallenge.query.first()
            print("WordChallengeDailyChallenge table exists")
        except:
            print("WordChallengeDailyChallenge table will be created")
        
        try:
            WordChallengeUserProgress.query.first()
            print("WordChallengeUserProgress table exists")
        except:
            print("WordChallengeUserProgress table will be created")
        
        try:
            KaspaPayment.query.first()
            print("KaspaPayment table exists")
        except:
            print("KaspaPayment table will be created")
        
        try:
            KaspaPrice.query.first()
            print("KaspaPrice table exists")
        except:
            print("KaspaPrice table will be created")
        
        # Create admin user
        admin_email = 'admin@geekprotocol.com'
        if not User.query.filter_by(email=admin_email).first():
            admin = User(
                username='AdminGeek',
                email=admin_email,
                role='admin',
                is_admin=True,
                level=10,
                reputation_score=100.0,
                character_affinity_giga=75.0,
                character_affinity_ace=75.0,
                word_challenge_wins=0,
                word_challenge_losses=0,
                word_challenge_draws=0,
                word_challenge_high_score=0,
                word_challenge_total_score=0,
                word_challenge_bingos=0
            )
            admin.set_password('admin123')
            db.session.add(admin)
            db.session.commit()
            print("Admin user created: AdminGeek / admin@geekprotocol.com / admin123")
        
        # Create AI user
        ai_email = 'ai@geekprotocol.com'
        if not User.query.filter_by(email=ai_email).first():
            ai_user = User(
                username='A.C.E.',
                email=ai_email,
                role='ai',
                is_admin=False,
                level=50,
                reputation_score=100.0,
                character_affinity_giga=50.0,
                character_affinity_ace=90.0
            )
            ai_user.set_password('ai_password')
            db.session.add(ai_user)
            db.session.commit()
            print("AI user created: A.C.E. / ai@geekprotocol.com")
        
        # Create validator user
        validator_email = 'validator@geekprotocol.com'
        if not User.query.filter_by(email=validator_email).first():
            validator = User(
                username='ValidatorGeek',
                email=validator_email,
                role='validator',
                level=10,
                reputation_score=100.0,
                character_affinity_giga=60.0,
                character_affinity_ace=70.0
            )
            validator.set_password('validator123')
            db.session.add(validator)
            db.session.commit()
            print("Validator user created: ValidatorGeek / validator@geekprotocol.com / validator123")
        
        # Create test player
        player_email = 'player@geekprotocol.com'
        if not User.query.filter_by(email=player_email).first():
            player = User(
                username='PlayerGeek',
                email=player_email,
                role='player',
                level=5,
                xp=2500,
                points=1200,
                geek_balance=50.0,
                current_streak=12,
                longest_streak=12,
                reputation_score=85.0,
                character_affinity_giga=55.0,
                character_affinity_ace=45.0,
                word_challenge_wins=3,
                word_challenge_losses=2,
                word_challenge_draws=0,
                word_challenge_high_score=245,
                word_challenge_total_score=1250,
                word_challenge_bingos=1,
                word_challenge_longest_word='MASTER'
            )
            player.set_password('player123')
            db.session.add(player)
            db.session.commit()
            print("Test player created: PlayerGeek / player@geekprotocol.com / player123")
        
        # Create topics
        if Topic.query.count() == 0:
            topics = [
                {"name": "Sci-Fi Cinema & TV", "description": "Questions about science fiction movies and television shows", "icon": "🎬"},
                {"name": "Fantasy Literature & Challenges", "description": "Questions about fantasy books, challenges, and lore", "icon": "🐉"},
                {"name": "Video Entertainment", "description": "Questions about video challenge history, characters, and mechanics", "icon": "🎮"},
                {"name": "Anime & Manga", "description": "Questions about anime, manga, and Japanese pop culture", "icon": "🎌"},
                {"name": "Comics & Superheroes", "description": "Questions about comic books, superheroes, and graphic novels", "icon": "🦸"},
                {"name": "Technology & Computing", "description": "Questions about technology history, programming, and computers", "icon": "💻"},
                {"name": "Science & Futurism", "description": "Questions about science, space, and futuristic concepts", "icon": "🔬"},
                {"name": "Tabletop & Board Activities", "description": "Questions about board challenges, RPGs, and tabletop gaming", "icon": "🎲"},
            ]
            for cat_data in topics:
                topic = Topic(**cat_data)
                db.session.add(topic)
            db.session.commit()
            print("Topics added to database")

        # Remove Word Challenges from selectable topics in existing databases.
        word_challenge_topic = Topic.query.filter_by(name='Word Challenges').first()
        if word_challenge_topic and word_challenge_topic.is_active:
            word_challenge_topic.is_active = False
            db.session.commit()
            print("Word Challenges topic deactivated")

        # Ensure Kaspa topic exists for imported Kaspa question sets.
      

        

        # Ensure every category used in sample_questions.py exists in Topic table.
        sample_topic_names = extract_sample_question_topic_names()
        existing_topic_names = {topic.name for topic in Topic.query.all()}
        missing_topic_names = sorted(name for name in sample_topic_names if name and name not in existing_topic_names)
        if missing_topic_names:
            for topic_name in missing_topic_names:
                db.session.add(Topic(
                    name=topic_name,
                    description=f"Auto-created from sample questions category: {topic_name}",
                    icon='🧩',
                    is_active=True
                ))
            db.session.commit()
            print(f"Added {len(missing_topic_names)} missing sample-question topics")
        
        # Create achievements
        if Achievement.query.count() == 0:
            for achievement_data in ACHIEVEMENTS:
                achievement = Achievement(**achievement_data)
                db.session.add(achievement)
            db.session.commit()
            print("Achievements added to database")

        # Ensure combo achievements exist even on existing databases
        add_combo_achievements()
        seed_tiered_achievements()
        ensure_crafting_recipes()
        
        # ==================== 500 GEEK STICKERS COLLECTION ====================
        
        print("Ensuring 500 Geek Stickers Collection is initialized (non-destructive)...")
        
        # Create (or reuse) the master sticker series - "500 Geeks of the Protocol"
        master_series = StickerSeries.query.filter_by(name="500 Geeks of the Protocol").first()
        if not master_series:
            master_series = StickerSeries(
                name="500 Geeks of the Protocol",
                description="The complete collection of 500 geek archetypes. Collect them all to become the Ultimate Geek!",
                total_stickers=500,
                is_active=True
            )
            db.session.add(master_series)
            db.session.commit()
            print(f"Created master sticker series: {master_series.name}")
        else:
            master_series.is_active = True
            master_series.total_stickers = 500
            db.session.commit()
        
        # Define rarity distribution for the 500 stickers
        # Legendary: 10 (2%), Epic: 40 (8%), Rare: 100 (20%), Uncommon: 150 (30%), Common: 200 (40%)
        
        # Define all 500 stickers by topic with emoji icons and rarity
        sticker_collection = [
            # ==================== GAMING GEEKS (1-50) ====================
            {"name": "Retro Challenger Geek", "emoji": "🕹️", "rarity": "common", "topic": "Gaming"},
            {"name": "Pro Challenger Geek", "emoji": "🎮", "rarity": "rare", "topic": "Gaming"},
            {"name": "Speedrunner Geek", "emoji": "⚡", "rarity": "epic", "topic": "Gaming"},
            {"name": "Modder Geek", "emoji": "🔧", "rarity": "rare", "topic": "Gaming"},
            {"name": "VR Geek", "emoji": "🥽", "rarity": "epic", "topic": "Gaming"},
            {"name": "Streamer Geek", "emoji": "📺", "rarity": "rare", "topic": "Gaming"},
            {"name": "Mobile Challenger Geek", "emoji": "📱", "rarity": "common", "topic": "Gaming"},
            {"name": "Arcade Geek", "emoji": "👾", "rarity": "uncommon", "topic": "Gaming"},
            {"name": "Board Challenge Geek", "emoji": "🎲", "rarity": "common", "topic": "Gaming"},
            {"name": "Esports Geek", "emoji": "🏆", "rarity": "epic", "topic": "Gaming"},
            {"name": "FPS Challenger Geek", "emoji": "🔫", "rarity": "common", "topic": "Gaming"},
            {"name": "MOBA Challenger Geek", "emoji": "⚔️", "rarity": "common", "topic": "Gaming"},
            {"name": "RPG Challenger Geek", "emoji": "🗡️", "rarity": "uncommon", "topic": "Gaming"},
            {"name": "Simulation Challenger Geek", "emoji": "✈️", "rarity": "common", "topic": "Gaming"},
            {"name": "Indie Challenge Geek", "emoji": "🎨", "rarity": "rare", "topic": "Gaming"},
            {"name": "Puzzle Challenge Geek", "emoji": "🧩", "rarity": "common", "topic": "Gaming"},
            {"name": "Fighting Challenge Geek", "emoji": "🥊", "rarity": "common", "topic": "Gaming"},
            {"name": "Strategy Challenge Geek", "emoji": "♟️", "rarity": "uncommon", "topic": "Gaming"},
            {"name": "Survival Challenge Geek", "emoji": "🏕️", "rarity": "common", "topic": "Gaming"},
            {"name": "Sandbox Challenge Geek", "emoji": "🏗️", "rarity": "uncommon", "topic": "Gaming"},
            {"name": "Platformer Geek", "emoji": "🎯", "rarity": "common", "topic": "Gaming"},
            {"name": "Roguelike Geek", "emoji": "💀", "rarity": "rare", "topic": "Gaming"},
            {"name": "VRChat Geek", "emoji": "👤", "rarity": "uncommon", "topic": "Gaming"},
            {"name": "Twitch Chat Geek", "emoji": "💬", "rarity": "common", "topic": "Gaming"},
            {"name": "Challenge Dev Geek", "emoji": "💻", "rarity": "epic", "topic": "Gaming"},
            {"name": "Level Designer Geek", "emoji": "🗺️", "rarity": "rare", "topic": "Gaming"},
            {"name": "Indie Dev Geek", "emoji": "🎪", "rarity": "rare", "topic": "Gaming"},
            {"name": "Cosplay Geek", "emoji": "🎭", "rarity": "uncommon", "topic": "Gaming"},
            {"name": "Collectible Card Geek", "emoji": "🃏", "rarity": "common", "topic": "Gaming"},
            {"name": "Tabletop RPG Geek", "emoji": "🐉", "rarity": "uncommon", "topic": "Gaming"},
            {"name": "Looter-Shooter Geek", "emoji": "📦", "rarity": "common", "topic": "Gaming"},
            {"name": "MMOG Geek", "emoji": "🌍", "rarity": "uncommon", "topic": "Gaming"},
            {"name": "MMORPG Geek", "emoji": "⚔️", "rarity": "uncommon", "topic": "Gaming"},
            {"name": "Roguelite Geek", "emoji": "🔄", "rarity": "rare", "topic": "Gaming"},
            {"name": "Open World Geek", "emoji": "🗺️", "rarity": "rare", "topic": "Gaming"},
            {"name": "Esports Analyst Geek", "emoji": "📊", "rarity": "epic", "topic": "Gaming"},
            {"name": "Challenge Soundtrack Geek", "emoji": "🎵", "rarity": "uncommon", "topic": "Gaming"},
            {"name": "Challenge Theory Geek", "emoji": "🎲", "rarity": "rare", "topic": "Gaming"},
            {"name": "Tactical Shooter Geek", "emoji": "🎯", "rarity": "common", "topic": "Gaming"},
            {"name": "Battle Royale Geek", "emoji": "🪂", "rarity": "common", "topic": "Gaming"},
            {"name": "Rhythm Challenge Geek", "emoji": "🎶", "rarity": "common", "topic": "Gaming"},
            {"name": "Horror Challenge Geek", "emoji": "👻", "rarity": "common", "topic": "Gaming"},
            {"name": "Dating Sim Geek", "emoji": "💕", "rarity": "uncommon", "topic": "Gaming"},
            {"name": "Visual Novel Geek", "emoji": "📖", "rarity": "common", "topic": "Gaming"},
            {"name": "Metroidvania Geek", "emoji": "🗺️", "rarity": "rare", "topic": "Gaming"},
            {"name": "DLC Collector Geek", "emoji": "💎", "rarity": "uncommon", "topic": "Gaming"},
            {"name": "Achievement Hunter Geek", "emoji": "🏅", "rarity": "rare", "topic": "Gaming"},
            {"name": "Live Production Geek", "emoji": "🎥", "rarity": "epic", "topic": "Gaming"},
            {"name": "Challenge Tester Geek", "emoji": "🐞", "rarity": "uncommon", "topic": "Gaming"},
            {"name": "QA Automation Geek", "emoji": "🤖", "rarity": "rare", "topic": "Gaming"},
            
            # ==================== PROGRAMMING & COMPUTER GEEKS (51-100) ====================
            {"name": "Coder Geek", "emoji": "⌨️", "rarity": "common", "topic": "Programming"},
            {"name": "Frontend Dev Geek", "emoji": "🎨", "rarity": "common", "topic": "Programming"},
            {"name": "Backend Dev Geek", "emoji": "⚙️", "rarity": "common", "topic": "Programming"},
            {"name": "Full-Stack Dev Geek", "emoji": "🌐", "rarity": "rare", "topic": "Programming"},
            {"name": "DevOps Geek", "emoji": "🔧", "rarity": "rare", "topic": "Programming"},
            {"name": "Cloud Architect Geek", "emoji": "☁️", "rarity": "epic", "topic": "Programming"},
            {"name": "Kubernetes Geek", "emoji": "⚓", "rarity": "epic", "topic": "Programming"},
            {"name": "Docker Geek", "emoji": "🐳", "rarity": "rare", "topic": "Programming"},
            {"name": "Cybersecurity Geek", "emoji": "🔒", "rarity": "epic", "topic": "Programming"},
            {"name": "Ethical Hacker Geek", "emoji": "👨‍💻", "rarity": "legendary", "topic": "Programming"},
            {"name": "QA Tester Geek", "emoji": "🔍", "rarity": "common", "topic": "Programming"},
            {"name": "Database Admin Geek", "emoji": "🗄️", "rarity": "uncommon", "topic": "Programming"},
            {"name": "SQL Geek", "emoji": "📊", "rarity": "common", "topic": "Programming"},
            {"name": "NoSQL Geek", "emoji": "🍃", "rarity": "uncommon", "topic": "Programming"},
            {"name": "API Dev Geek", "emoji": "🔌", "rarity": "uncommon", "topic": "Programming"},
            {"name": "Mobile Dev Geek", "emoji": "📱", "rarity": "rare", "topic": "Programming"},
            {"name": "iOS Dev Geek", "emoji": "🍎", "rarity": "rare", "topic": "Programming"},
            {"name": "Android Dev Geek", "emoji": "🤖", "rarity": "rare", "topic": "Programming"},
            {"name": "Embedded Systems Geek", "emoji": "🔌", "rarity": "epic", "topic": "Programming"},
            {"name": "IoT Geek", "emoji": "📡", "rarity": "rare", "topic": "Programming"},
            {"name": "Network Engineer Geek", "emoji": "🌐", "rarity": "uncommon", "topic": "Programming"},
            {"name": "Pen-Tester Geek", "emoji": "🎯", "rarity": "epic", "topic": "Programming"},
            {"name": "Blockchain Dev Geek", "emoji": "⛓️", "rarity": "legendary", "topic": "Programming"},
            {"name": "Smart Contract Geek", "emoji": "📜", "rarity": "epic", "topic": "Programming"},
            {"name": "NFT Dev Geek", "emoji": "🖼️", "rarity": "rare", "topic": "Programming"},
            {"name": "Hardware Geek", "emoji": "🖥️", "rarity": "uncommon", "topic": "Programming"},
            {"name": "Raspberry Pi Geek", "emoji": "🍓", "rarity": "uncommon", "topic": "Programming"},
            {"name": "Arduino Geek", "emoji": "🔌", "rarity": "common", "topic": "Programming"},
            {"name": "FPGA Geek", "emoji": "🔲", "rarity": "legendary", "topic": "Programming"},
            {"name": "VR Dev Geek", "emoji": "🥽", "rarity": "epic", "topic": "Programming"},
            {"name": "AR Dev Geek", "emoji": "🕶️", "rarity": "epic", "topic": "Programming"},
            {"name": "AI Research Geek", "emoji": "🧠", "rarity": "legendary", "topic": "Programming"},
            {"name": "ML Engineer Geek", "emoji": "🤖", "rarity": "legendary", "topic": "Programming"},
            {"name": "Data Engineer Geek", "emoji": "🔄", "rarity": "rare", "topic": "Programming"},
            {"name": "Big Data Geek", "emoji": "💿", "rarity": "epic", "topic": "Programming"},
            {"name": "Visualization Geek", "emoji": "📈", "rarity": "rare", "topic": "Programming"},
            {"name": "BI Analyst Geek", "emoji": "📉", "rarity": "uncommon", "topic": "Programming"},
            {"name": "Algorithm Geek", "emoji": "🔢", "rarity": "epic", "topic": "Programming"},
            {"name": "Functional Programming Geek", "emoji": "λ", "rarity": "legendary", "topic": "Programming"},
            {"name": "Rust Geek", "emoji": "🦀", "rarity": "rare", "topic": "Programming"},
            {"name": "Python Geek", "emoji": "🐍", "rarity": "common", "topic": "Programming"},
            {"name": "GoLang Geek", "emoji": "🐹", "rarity": "rare", "topic": "Programming"},
            {"name": "Java Geek", "emoji": "☕", "rarity": "common", "topic": "Programming"},
            {"name": "Haskell Geek", "emoji": "λ", "rarity": "epic", "topic": "Programming"},
            {"name": "Linux Kernel Geek", "emoji": "🐧", "rarity": "legendary", "topic": "Programming"},
            {"name": "OS Architect Geek", "emoji": "🏗️", "rarity": "legendary", "topic": "Programming"},
            {"name": "Shell Scripting Geek", "emoji": "🐚", "rarity": "common", "topic": "Programming"},
            {"name": "Bash Geek", "emoji": ">$", "rarity": "common", "topic": "Programming"},
            {"name": "Windows Admin Geek", "emoji": "🪟", "rarity": "common", "topic": "Programming"},
            {"name": "Mac Admin Geek", "emoji": "🍏", "rarity": "uncommon", "topic": "Programming"},
            
            # ==================== ACADEMIC & KNOWLEDGE GEEKS (101-150) ====================
            {"name": "Bookworm Geek", "emoji": "📚", "rarity": "common", "topic": "Academic"},
            {"name": "History Geek", "emoji": "🏛️", "rarity": "common", "topic": "Academic"},
            {"name": "Mythology Geek", "emoji": "🏺", "rarity": "uncommon", "topic": "Academic"},
            {"name": "Math Geek", "emoji": "🧮", "rarity": "common", "topic": "Academic"},
            {"name": "Physics Geek", "emoji": "⚛️", "rarity": "rare", "topic": "Academic"},
            {"name": "Chemistry Geek", "emoji": "🧪", "rarity": "uncommon", "topic": "Academic"},
            {"name": "Biology Geek", "emoji": "🧬", "rarity": "uncommon", "topic": "Academic"},
            {"name": "Philosophy Geek", "emoji": "🤔", "rarity": "rare", "topic": "Academic"},
            {"name": "Linguistics Geek", "emoji": "🗣️", "rarity": "rare", "topic": "Academic"},
            {"name": "Library Science Geek", "emoji": "📋", "rarity": "uncommon", "topic": "Academic"},
            {"name": "Art History Geek", "emoji": "🎨", "rarity": "uncommon", "topic": "Academic"},
            {"name": "Paleontology Geek", "emoji": "🦕", "rarity": "epic", "topic": "Academic"},
            {"name": "Archaeology Geek", "emoji": "🏺", "rarity": "epic", "topic": "Academic"},
            {"name": "Theology Geek", "emoji": "⛪", "rarity": "rare", "topic": "Academic"},
            {"name": "Political Science Geek", "emoji": "🏛️", "rarity": "uncommon", "topic": "Academic"},
            {"name": "Economics Geek", "emoji": "📊", "rarity": "uncommon", "topic": "Academic"},
            {"name": "Psychology Geek", "emoji": "🧠", "rarity": "rare", "topic": "Academic"},
            {"name": "Sociology Geek", "emoji": "👥", "rarity": "uncommon", "topic": "Academic"},
            {"name": "Anthropology Geek", "emoji": "🌍", "rarity": "rare", "topic": "Academic"},
            {"name": "Geography Geek", "emoji": "🌏", "rarity": "common", "topic": "Academic"},
            {"name": "Oceanography Geek", "emoji": "🌊", "rarity": "epic", "topic": "Academic"},
            {"name": "Environmental Science Geek", "emoji": "🌿", "rarity": "rare", "topic": "Academic"},
            {"name": "Ecology Geek", "emoji": "🌲", "rarity": "rare", "topic": "Academic"},
            {"name": "Neuroscience Geek", "emoji": "🧠", "rarity": "legendary", "topic": "Academic"},
            {"name": "Criminology Geek", "emoji": "🔍", "rarity": "rare", "topic": "Academic"},
            {"name": "Law Geek", "emoji": "⚖️", "rarity": "rare", "topic": "Academic"},
            {"name": "Medicine Geek", "emoji": "🩺", "rarity": "epic", "topic": "Academic"},
            {"name": "Anatomy Geek", "emoji": "🦴", "rarity": "rare", "topic": "Academic"},
            {"name": "Marine Biology Geek", "emoji": "🐠", "rarity": "epic", "topic": "Academic"},
            {"name": "Genetics Geek", "emoji": "🧬", "rarity": "epic", "topic": "Academic"},
            {"name": "Microbiology Geek", "emoji": "🦠", "rarity": "rare", "topic": "Academic"},
            {"name": "Zoology Geek", "emoji": "🐘", "rarity": "uncommon", "topic": "Academic"},
            {"name": "Botany Geek", "emoji": "🌱", "rarity": "uncommon", "topic": "Academic"},
            {"name": "Quantum Physics Geek", "emoji": "⚛️", "rarity": "legendary", "topic": "Academic"},
            {"name": "Astrophysics Geek", "emoji": "🌠", "rarity": "legendary", "topic": "Academic"},
            {"name": "Cosmology Geek", "emoji": "🌌", "rarity": "legendary", "topic": "Academic"},
            {"name": "Neurology Geek", "emoji": "🧠", "rarity": "epic", "topic": "Academic"},
            {"name": "Semiotics Geek", "emoji": "🔣", "rarity": "epic", "topic": "Academic"},
            {"name": "Cryptography Geek", "emoji": "🔐", "rarity": "legendary", "topic": "Academic"},
            {"name": "Statistics Geek", "emoji": "📊", "rarity": "rare", "topic": "Academic"},
            {"name": "Probability Theory Geek", "emoji": "🎲", "rarity": "rare", "topic": "Academic"},
            {"name": "Logic Geek", "emoji": "🔲", "rarity": "rare", "topic": "Academic"},
            {"name": "Epistemology Geek", "emoji": "🧠", "rarity": "legendary", "topic": "Academic"},
            {"name": "Phenomenology Geek", "emoji": "🌀", "rarity": "legendary", "topic": "Academic"},
            {"name": "Rhetoric Geek", "emoji": "🎭", "rarity": "epic", "topic": "Academic"},
            {"name": "Demography Geek", "emoji": "👥", "rarity": "rare", "topic": "Academic"},
            {"name": "Linguistic Anthropology Geek", "emoji": "🗣️", "rarity": "epic", "topic": "Academic"},
            {"name": "Paleobotany Geek", "emoji": "🌿", "rarity": "epic", "topic": "Academic"},
            {"name": "Paleozoology Geek", "emoji": "🦣", "rarity": "epic", "topic": "Academic"},
            {"name": "Climatology Geek", "emoji": "🌍", "rarity": "epic", "topic": "Academic"},
            

            {"name": "ASMR Geek", "emoji": "👂", "rarity": "uncommon", "topic": "Lifestyle"},
            {"name": "Perfume Blending Geek", "emoji": "🧴", "rarity": "legendary", "topic": "Lifestyle"},
        ]
        
        # Verify we have exactly 500 stickers
        print(f"Sticker collection defined: {len(sticker_collection)} stickers")
        
        # Add all stickers to the database if missing
        stickers_added = 0
        existing_numbers = {
            row.number for row in Sticker.query.filter_by(series_id=master_series.id).with_entities(Sticker.number).all()
        }
        for i, sticker_data in enumerate(sticker_collection, start=1):
            if i in existing_numbers:
                continue
            sticker = Sticker(
                series_id=master_series.id,
                name=sticker_data["name"],
                image=f"sticker_{i:03d}.png",
                rarity=sticker_data["rarity"],
                number=i
            )
            db.session.add(sticker)
            stickers_added += 1
            if stickers_added % 100 == 0:
                db.session.commit()
                print(f"  Added {stickers_added} stickers...")
        
        db.session.commit()
        print(f"✅ Added {stickers_added} stickers to '{master_series.name}' series!")
        
        # Create additional sticker series for specific collections
        def ensure_series_with_stickers(series_name, description, total_stickers, subset, image_prefix):
            series = StickerSeries.query.filter_by(name=series_name).first()
            if not series:
                series = StickerSeries(
                    name=series_name,
                    description=description,
                    total_stickers=total_stickers,
                    is_active=True
                )
                db.session.add(series)
                db.session.commit()
            else:
                series.is_active = True
                series.total_stickers = total_stickers
                if description:
                    series.description = description
                db.session.commit()

            existing_numbers = {
                row.number for row in Sticker.query.filter_by(series_id=series.id).with_entities(Sticker.number).all()
            }
            added = 0
            for i, sticker_data in enumerate(subset, start=1):
                if i in existing_numbers:
                    continue
                db.session.add(Sticker(
                    series_id=series.id,
                    name=sticker_data["name"],
                    image=f"{image_prefix}_{i:03d}.png",
                    rarity=sticker_data["rarity"],
                    number=i
                ))
                added += 1
            db.session.commit()
            print(f"✅ Ensured '{series_name}' series. Added {added} missing stickers.")

        ensure_series_with_stickers(
            "Gaming Legends",
            "Collect the ultimate gaming archetypes! From Retro to Esports, prove your gaming knowledge.",
            50,
            sticker_collection[0:50],
            "gaming"
        )
        ensure_series_with_stickers(
            "Code Masters",
            "Programming and computer science geeks unite! Collect all dev archetypes.",
            50,
            sticker_collection[50:100],
            "coding"
        )
        ensure_series_with_stickers(
            "Science & Discovery",
            "Explore the universe of knowledge with these academic and science geeks.",
            100,
            sticker_collection[100:150] + sticker_collection[300:350],
            "science"
        )
        ensure_series_with_stickers(
            "Creative Arts",
            "Artists, musicians, and creators of all kinds. Express yourself!",
            100,
            sticker_collection[150:250],
            "arts"
        )
        ensure_series_with_stickers(
            "Pop Culture Icons",
            "Film, TV, and internet culture collide in this epic collection.",
            100,
            sticker_collection[250:300] + sticker_collection[400:450],
            "pop"
        )
        ensure_series_with_stickers(
            "Fantasy Realms",
            "Enter worlds of magic, dragons, and adventure with these RPG and fantasy geeks.",
            50,
            sticker_collection[350:400],
            "fantasy"
        )
        ensure_series_with_stickers(
            "Lifestyle & Hobby",
            "From coffee connoisseurs to fitness trackers, celebrate your daily passions.",
            50,
            sticker_collection[450:500],
            "lifestyle"
        )
        
        # Give starter stickers to test player
        player = User.query.filter_by(email='player@geekprotocol.com').first()
        if player:
            common_stickers = Sticker.query.filter_by(series_id=master_series.id, rarity='common').limit(10).all()
            uncommon_stickers = Sticker.query.filter_by(series_id=master_series.id, rarity='uncommon').limit(5).all()
            rare_stickers = Sticker.query.filter_by(series_id=master_series.id, rarity='rare').limit(2).all()
            all_starter_stickers = common_stickers + uncommon_stickers + rare_stickers
            player_owned = {row.sticker_id for row in UserSticker.query.filter_by(user_id=player.id).all()}
            
            for sticker in all_starter_stickers:
                if sticker.id in player_owned:
                    continue
                user_sticker = UserSticker(
                    user_id=player.id,
                    sticker_id=sticker.id,
                    is_duplicate=False
                )
                db.session.add(user_sticker)
            
            db.session.commit()
            print(f"✅ Gave {len(all_starter_stickers)} starter stickers to test player!")
        
        print("\n" + "=" * 60)
        print("🎉 500 GEEK STICKERS COLLECTION SUCCESSFULLY CREATED! 🎉")
        print("=" * 60)
        print(f"📊 Total Sticker Series: {StickerSeries.query.count()}")
        print(f"📊 Total Individual Stickers: {Sticker.query.count()}")
        print(f"📊 Rarity Distribution:")
        print(f"   - Common: {Sticker.query.filter_by(rarity='common').count()}")
        print(f"   - Uncommon: {Sticker.query.filter_by(rarity='uncommon').count()}")
        print(f"   - Rare: {Sticker.query.filter_by(rarity='rare').count()}")
        print(f"   - Epic: {Sticker.query.filter_by(rarity='epic').count()}")
        print(f"   - Legendary: {Sticker.query.filter_by(rarity='legendary').count()}")
        print("=" * 60)
        
        # Create daily challenge for today
        create_daily_challenge()
        print("Daily challenge created for today")
        
      
        
        admin = User.query.filter_by(email='admin@geekprotocol.com').first()
        admin_id = admin.id if admin else 1
        
        topic_map = {topic.name: topic.id for topic in Topic.query.all()}
        sample_questions = build_sample_questions(topic_map)

        existing_questions_count = Question.query.count()
        if existing_questions_count < len(sample_questions):
            existing_questions_set = {q.question for q in Question.query.all()}
            questions_added = 0
            
            for q_data in sample_questions:
                if q_data["topic_id"] and q_data["question"] not in existing_questions_set:
                    question = Question(
                        question=q_data["question"],
                        option1=q_data["option1"],
                        option2=q_data["option2"],
                        option3=q_data["option3"],
                        option4=q_data["option4"],
                        correct_option=q_data["correct_option"],
                        difficulty=q_data["difficulty"],
                        topic_id=q_data["topic_id"],
                        created_by=admin_id,
                        approved_by=admin_id,
                        status='approved',
                        source_link=q_data.get("source_link", ""),
                        subtopic=q_data.get("subtopic"),
                        fun_fact=q_data.get("fun_fact"),
                        date_approved=datetime.datetime.utcnow()
                    )
                    db.session.add(question)
                    existing_questions_set.add(q_data["question"])
                    questions_added += 1
            
            db.session.commit()
            print(f"{questions_added} sample questions added. Total: {Question.query.count()} questions in database")
        
        total_questions = Question.query.count()
        print(f"✅ Database initialized with {total_questions} questions")
        print(f"✅ AI Knowledge Base v{AI_KNOWLEDGE.get('version', '1.0')} loaded")
        print(f"   - {len(AI_KNOWLEDGE.get('knowledge_domains', {}))} knowledge domains")
        print(f"   - {len(AI_KNOWLEDGE.get('characters', {}))} AI characters")
        print(f"   - {len(AI_KNOWLEDGE.get('challenge_mechanics_knowledge', {}))} challenge mechanics documented")
        print(f"✅ Word Challenges module initialized with Scrabble scoring system")
        print(f"   - Dictionary loaded with {len(DICTIONARY)} words")
        print(f"   - Letter distribution: {sum(LETTER_DISTRIBUTION.values())} tiles")
        print(f"✅ STICKER SYSTEM: 500 Geek archetypes across 8 themed series!")
        print(f"   - Collect them all to become the Ultimate Geek! 🏆")
        
        if KaspaPrice.query.count() == 0:
            kaspa_price = KaspaPrice(
                usd_price=0.04,
                geek_per_kas=25,
                updated_at=datetime.datetime.utcnow()
            )
            db.session.add(kaspa_price)
            db.session.commit()
            print("✅ Kaspa exchange rate initialized: 1 KAS = 25 GEEK")
        
        print("✅ Level system updated to Level 100 with stage tags!")
        print("   - Novice (1-9)")
        print("   - Apprentice (10-19)")
        print("   - Journeyman (20-29)")
        print("   - Adept (30-39)")
        print("   - Expert (40-49)")
        print("   - Master (50-59)")
        print("   - Grandmaster (60-69)")
        print("   - Legend (70-79)")
        print("   - Champion (80-89)")
        print("   - Elite (90-99)")
        print("   - ULTIMATE GEEK (100)")
        print("✅ Kaspa payment integration ready for GEEK purchases!")

# ==================== DAILY QUIZ GAME MASTER ====================

DAILY_THEMES = {
    0: "⚡ MOMENTUM MONDAY",
    1: "🧠 TURBO TUESDAY",
    2: "🌀 WILDCARD WEDNESDAY",
    3: "🔥 THROWBACK THURSDAY",
    4: "🎯 FOCUS FRIDAY",
    5: "🏆 SHOWDOWN SATURDAY",
    6: "🌟 SUPREME SUNDAY"
}

def get_daily_theme():
    """Get today's theme based on day of week"""
    return DAILY_THEMES[datetime.datetime.utcnow().weekday()]

def get_rank_badge(score):
    """Determine rank badge based on score"""
    if score >= 140:
        return {"badge": "🌟", "name": "LEGENDARY GEEK", "color": "warning"}
    elif score >= 110:
        return {"badge": "💎", "name": "Platinum Pro", "color": "info"}
    elif score >= 80:
        return {"badge": "🥇", "name": "Gold Genius", "color": "warning"}
    elif score >= 50:
        return {"badge": "🥈", "name": "Silver Scholar", "color": "secondary"}
    else:
        return {"badge": "🥉", "name": "Bronze Rookie", "color": "danger"}

@app.route('/daily_quiz')
@login_required
def daily_quiz():
    """Daily Quiz Game Master - 10 questions per day"""
    today = datetime.date.today()
    
    # Check if user already completed today's quiz
    daily_attempts = Attempt.query.filter(
        Attempt.user_id == current_user.id,
        db.func.date(Attempt.date_attempted) == today,
        Attempt.session_id.like('daily_quiz_%')
    ).count()
    
    if daily_attempts >= 10:
        flash('You have already completed today\'s Daily Quiz! Come back tomorrow! 🌟', 'info')
        return redirect(url_for('dashboard'))
    
    # Initialize session if needed
    if 'daily_quiz_session' not in session or session.get('daily_quiz_date') != str(today):
        session['daily_quiz_session'] = f"daily_quiz_{today}_{current_user.id}_{int(time.time())}"
        session['daily_quiz_date'] = str(today)
        session['daily_quiz_score'] = 0
        session['daily_quiz_correct'] = 0
        session['daily_quiz_combo'] = 0
        session['daily_quiz_max_combo'] = 0
        session['daily_quiz_speed_bonus'] = 0
        session['daily_quiz_first_question'] = True
    
    # Get next question
    answered_ids = [a.question_id for a in Attempt.query.filter(
        Attempt.user_id == current_user.id,
        Attempt.session_id == session['daily_quiz_session']
    ).all()]
    
    question = Question.query.filter(
        Question.status == 'approved',
        ~Question.id.in_(answered_ids) if answered_ids else True
    ).order_by(db.func.random()).first()
    
    if not question:
        flash('No questions available. Please try again later.', 'warning')
        return redirect(url_for('dashboard'))
    
    # Get character message every 3rd question
    character = None
    character_message = None
    current_num = daily_attempts + 1
    
    if current_num % 3 == 0:
        character = get_character_for_context('quiz_start')
        if character == 'GIGA':
            character_message = get_giga_message(current_user, 'quiz_start')
        else:
            character_message = get_ace_message(current_user, 'quiz_start')
    
    return render_template('daily_quiz.html',
                         question=question,
                         daily_theme=get_daily_theme(),
                         current_question_num=current_num,
                         session_score=session.get('daily_quiz_score', 0),
                         correct_count=session.get('daily_quiz_correct', 0),
                         combo_count=session.get('daily_quiz_combo', 0),
                         combo_multiplier=min(2.0, 1.0 + (session.get('daily_quiz_combo', 0) * 0.1)),
                         character=character,
                         character_message=character_message,
                         start_time=int(time.time() * 1000))

@app.route('/daily_quiz/submit', methods=['POST'])
@login_required
def daily_quiz_submit():
    """Process daily quiz answer"""
    question_id = request.form.get('question_id')
    raw_answer = request.form.get('answer')
    if not raw_answer:
        flash('Please select an answer!', 'warning')
        return redirect(url_for('daily_quiz'))
    answer = int(raw_answer)
    start_time = int(request.form.get('start_time', 0))
    
    question = Question.query.get_or_404(question_id)
    is_correct = (answer == question.correct_option)
    
    # Calculate time taken
    time_taken = (time.time() * 1000 - start_time) / 1000 if start_time else 15.0
    time_taken = max(0.1, min(30, time_taken))
    
    # Base points
    points = 10 if is_correct else 0
    
    # Speed bonus (under 5 seconds)
    speed_bonus = 0
    if is_correct and time_taken < 5:
        speed_bonus = 5
        points += speed_bonus
        session['daily_quiz_speed_bonus'] = session.get('daily_quiz_speed_bonus', 0) + speed_bonus
    
    # Combo tracking
    if is_correct:
        session['daily_quiz_combo'] = session.get('daily_quiz_combo', 0) + 1
        session['daily_quiz_max_combo'] = max(session.get('daily_quiz_max_combo', 0), session['daily_quiz_combo'])
        
        # Combo multiplier (up to 2x)
        combo_multiplier = min(2.0, 1.0 + (session['daily_quiz_combo'] * 0.1))
        points = int(points * combo_multiplier)
    else:
        session['daily_quiz_combo'] = 0
    
    # Streak multiplier
    streak_multiplier = get_streak_multiplier(current_user.current_streak)
    points = int(points * streak_multiplier)
    
    # First question bonus
    if session.get('daily_quiz_first_question'):
        points += 5
        session['daily_quiz_first_question'] = False
    
    # Update session
    session['daily_quiz_score'] = session.get('daily_quiz_score', 0) + points
    if is_correct:
        session['daily_quiz_correct'] = session.get('daily_quiz_correct', 0) + 1
    
    # Save attempt
    attempt = Attempt(
        user_id=current_user.id,
        question_id=question_id,
        selected_option=answer,
        is_correct=is_correct,
        time_taken=time_taken,
        session_id=session['daily_quiz_session'],
        streak_bonus_applied=streak_multiplier
    )
    db.session.add(attempt)
    
    # Update user points
    current_user.points += points
    
    # Award creator earnings
    if is_correct and question.created_by:
        award_creator_earnings(question_id, CCE_CREATOR_REWARD_PER_SERVE, session['daily_quiz_session'], current_user.id)
    
    # Check if quiz is complete
    total_attempts = Attempt.query.filter(
        Attempt.user_id == current_user.id,
        Attempt.session_id == session['daily_quiz_session']
    ).count()
    
    if total_attempts >= 10:
        # Quiz complete - show results
        db.session.commit()
        return redirect(url_for('daily_quiz_results'))
    
    db.session.commit()
    
    # Show feedback
    if is_correct:
        reactions = ["🎯 NAILED IT!", "🔥 ON FIRE!", "⚡ LIGHTNING FAST!", "💪 CRUSHING IT!", "🌟 BRILLIANT!"]
        flash(random.choice(reactions), 'success')
    else:
        reactions = ["💀 Not quite!", "🤔 Close, but no!", "😬 Oops!", "💭 Try again next time!"]
        flash(random.choice(reactions), 'warning')
    
    return redirect(url_for('daily_quiz'))

@app.route('/daily_quiz/submit_ajax', methods=['POST'], endpoint='daily_quiz_submit_ajax')
@login_required
def daily_quiz_submit_ajax():
    """AJAX endpoint — processes an answer and returns JSON for the feedback overlay."""
    data = request.get_json(silent=True) or {}
    question_id = data.get('question_id') or request.form.get('question_id')
    raw_answer  = data.get('answer') or request.form.get('answer')
    start_time  = int(data.get('start_time') or request.form.get('start_time', 0) or 0)

    if not raw_answer:
        return jsonify({'error': 'No answer provided'}), 400

    answer   = int(raw_answer)
    question = Question.query.get_or_404(question_id)
    is_correct = (answer == question.correct_option)

    # ── Time taken ──
    time_taken = (time.time() * 1000 - start_time) / 1000 if start_time else 15.0
    time_taken = max(0.1, min(30, time_taken))

    # ── Base points ──
    points = 10 if is_correct else 0

    # ── Speed bonus ──
    speed_bonus = 0
    if is_correct and time_taken < 5:
        speed_bonus = 5
        points += speed_bonus
        session['daily_quiz_speed_bonus'] = session.get('daily_quiz_speed_bonus', 0) + speed_bonus

    # ── Combo tracking ──
    if is_correct:
        session['daily_quiz_combo'] = session.get('daily_quiz_combo', 0) + 1
        session['daily_quiz_max_combo'] = max(
            session.get('daily_quiz_max_combo', 0), session['daily_quiz_combo'])
        combo_multiplier = min(2.0, 1.0 + (session['daily_quiz_combo'] * 0.1))
        points = int(points * combo_multiplier)
    else:
        session['daily_quiz_combo'] = 0
        combo_multiplier = 1.0

    # ── Streak multiplier ──
    streak_multiplier = get_streak_multiplier(current_user.current_streak)
    points = int(points * streak_multiplier)

    # ── First-question bonus ──
    login_bonus_awarded = 0
    if session.get('daily_quiz_first_question'):
        login_bonus_awarded = 5
        points += login_bonus_awarded
        session['daily_quiz_first_question'] = False

    # ── Update session totals ──
    session['daily_quiz_score'] = session.get('daily_quiz_score', 0) + points
    if is_correct:
        session['daily_quiz_correct'] = session.get('daily_quiz_correct', 0) + 1

    # ── Save Attempt ──
    attempt = Attempt(
        user_id=current_user.id,
        question_id=question_id,
        selected_option=answer,
        is_correct=is_correct,
        time_taken=time_taken,
        session_id=session.get('daily_quiz_session', f'daily_quiz_{current_user.id}'),
        streak_bonus_applied=streak_multiplier
    )
    db.session.add(attempt)
    current_user.points += points

    # ── Creator earnings ──
    if is_correct and question.created_by:
        award_creator_earnings(question_id, CCE_CREATOR_REWARD_PER_SERVE,
                               session.get('daily_quiz_session'), current_user.id)

    # ── Check completion ──
    total_attempts = Attempt.query.filter(
        Attempt.user_id == current_user.id,
        Attempt.session_id == session.get('daily_quiz_session')
    ).count()  # auto-flush includes the unsaved attempt

    quiz_complete = total_attempts >= 10
    db.session.commit()

    # ── Correct/wrong reactions ──
    if is_correct:
        if time_taken < 5:
            reaction = random.choice(["⚡ LIGHTNING FAST!", "🎯 SPEEDY SNIPER!", "💥 BLAZING!"])
        elif session.get('daily_quiz_combo', 0) >= 3:
            reaction = random.choice(["🔥 ON FIRE!", "🌋 UNSTOPPABLE!", "💪 DOMINATING!"])
        else:
            reaction = random.choice(["🎯 NAILED IT!", "🌟 BRILLIANT!", "✅ CORRECT!"])
    else:
        reaction = random.choice(["💀 Not quite!", "🤔 Close, but no!", "😬 Oops!", "💭 Almost!"])

    # ── Correct answer text ──
    correct_option_map = {
        1: question.option1, 2: question.option2,
        3: question.option3, 4: question.option4
    }
    correct_answer_text = correct_option_map.get(question.correct_option, '')

    return jsonify({
        'is_correct':          is_correct,
        'reaction':            reaction,
        'points_earned':       points,
        'total_score':         session.get('daily_quiz_score', 0),
        'combo':               session.get('daily_quiz_combo', 0),
        'speed_bonus':         speed_bonus,
        'login_bonus':         login_bonus_awarded,
        'correct_answer':      question.correct_option,
        'correct_answer_text': correct_answer_text,
        'quiz_complete':       quiz_complete,
        'next_url':            url_for('daily_quiz_results') if quiz_complete else url_for('daily_quiz')
    })


@app.route('/daily_quiz/results')
@login_required
def daily_quiz_results():
    """Show daily quiz results scorecard"""
    if 'daily_quiz_session' not in session:
        return redirect(url_for('daily_quiz'))
    
    # Get all attempts for this session
    attempts = Attempt.query.filter(
        Attempt.user_id == current_user.id,
        Attempt.session_id == session['daily_quiz_session']
    ).all()
    
    if len(attempts) < 10:
        return redirect(url_for('daily_quiz'))
    
    # Calculate stats
    correct_count = sum(1 for a in attempts if a.is_correct)
    accuracy = int((correct_count / 10) * 100)
    total_score = session.get('daily_quiz_score', 0)
    longest_combo = session.get('daily_quiz_max_combo', 0)
    
    # Calculate breakdown
    base_points = correct_count * 10
    speed_bonus = session.get('daily_quiz_speed_bonus', 0)
    streak_multiplier = get_streak_multiplier(current_user.current_streak)
    streak_bonus = int(base_points * (streak_multiplier - 1.0))
    perfect_bonus = 50 if correct_count == 10 else 0
    login_bonus = 5  # First question bonus
    
    # Add perfect bonus if applicable
    if perfect_bonus > 0:
        current_user.points += perfect_bonus
        total_score += perfect_bonus
    
    # Award bonus sticker pack for 80%+ accuracy
    bonus_pack = False
    if accuracy >= 80:
        bonus_pack = True
        pack = StickerPack(
            user_id=current_user.id,
            pack_type='premium',
            source='daily_quiz',
            source_detail=f'Daily Quiz {accuracy}% accuracy',
            stickers_per_pack=5
        )
        db.session.add(pack)
    
    # Get rank
    rank = get_rank_badge(total_score)
    
    # Character message
    character = get_character_for_context('quiz_start')
    if character == 'GIGA':
        if accuracy == 100:
            character_message = get_giga_message(current_user, 'perfect_round')
        elif accuracy >= 80:
            character_message = get_giga_message(current_user, 'achievement')
        else:
            character_message = get_giga_message(current_user, 'encouragement')
    else:
        if accuracy == 100:
            character_message = get_ace_message(current_user, 'perfect_round')
        elif accuracy >= 80:
            character_message = get_ace_message(current_user, 'mastery_demonstrated')
        else:
            character_message = get_ace_message(current_user, 'assessment')
    
    # Check achievements
    check_achievements(current_user, 'correct_answers', 
                      Attempt.query.filter_by(user_id=current_user.id, is_correct=True).count())
    
    db.session.commit()
    
    # Clear session
    session.pop('daily_quiz_session', None)
    session.pop('daily_quiz_score', None)
    session.pop('daily_quiz_correct', None)
    session.pop('daily_quiz_combo', None)
    session.pop('daily_quiz_max_combo', None)
    session.pop('daily_quiz_speed_bonus', None)
    session.pop('daily_quiz_first_question', None)
    
    return render_template('daily_quiz_results.html',
                         daily_theme=get_daily_theme(),
                         total_score=total_score,
                         accuracy=accuracy,
                         correct_count=correct_count,
                         longest_combo=longest_combo,
                         base_points=base_points,
                         speed_bonus=speed_bonus,
                         streak_multiplier=streak_multiplier,
                         streak_bonus=streak_bonus,
                         perfect_bonus=perfect_bonus,
                         login_bonus=login_bonus,
                         rank_badge=rank['badge'],
                         rank_name=rank['name'],
                         rank_color=rank['color'],
                         bonus_pack=bonus_pack,
                         character=character,
                         character_message=character_message)


if __name__ == '__main__':
    init_db()
    # Start real Kaspa testnet-10 payment polling thread
    import kaspaintegration
    kaspaintegration.start_payment_polling_thread(app)
    app.run(host='0.0.0.0', port=int(os.environ.get('PORT', '5000')))