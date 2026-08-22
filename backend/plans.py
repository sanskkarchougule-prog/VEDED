"""Plans, credit packs, and content catalog for VEDED + BookStream."""

# VEDED subscription tiers
VEDED_PLANS = {
    "free": {
        "id": "free",
        "name": "Free",
        "price_usd": 0.0,
        "credits": {"image": 10, "video": 1, "audio_chars": 2000, "dubbing": 0},
        "features": [
            "Gemini Nano Banana image gen (free tier)",
            "ChatGPT-driven prompt suggestions",
            "1 short AI video / month",
            "Standard queue · watermark on exports",
            "Community support",
        ],
        "highlight": False,
        "engine_note": "Free open models (Nano Banana, gpt-image-1). Watermarked exports.",
    },
    "veded_standard": {
        "id": "veded_standard",
        "name": "Standard",
        "price_usd": 12.0,
        "credits": {"image": 250, "video": 25, "audio_chars": 100000, "dubbing": 0},
        "features": [
            "FLUX Schnell + Nano Banana image gen",
            "Kling 3.0 image-to-video (5s clips)",
            "Sarvam Bulbul v3 TTS · Hindi/Tamil/Telugu",
            "No watermark · Fast queue",
            "HD 1080p export · Multi-clip stitching",
        ],
        "highlight": False,
        "engine_note": "FLUX Schnell · Kling 3.0 · Sarvam Bulbul v3.",
    },
    "veded_pro": {
        "id": "veded_pro",
        "name": "Pro",
        "price_usd": 29.0,
        "credits": {"image": 750, "video": 75, "audio_chars": 300000, "dubbing": 100},
        "features": [
            "SDXL Turbo + Nano Banana Pro (high-res stills)",
            "Sora 2 & Veo 3.1 text-to-video",
            "Soul ID — character consistency lock",
            "Cinematic camera controls (dolly, orbit, pan, tilt)",
            "4K upscaling · Priority GPU queue",
            "Commercial rights · Voice swapping & dubbing",
        ],
        "highlight": True,
        "engine_note": "SDXL Turbo · Sora 2 · Veo 3.1 · Sarvam Bulbul v3.",
    },
    "veded_series": {
        "id": "veded_series",
        "name": "Web Series",
        "price_usd": 119.0,
        "credits": {"image": 1500, "video": 150, "audio_chars": 800000, "dubbing": 500},
        "features": [
            "Everything in Pro, plus:",
            "Season Planner + per-character Cast Bibles",
            "Multi-episode dispatcher (dispatch 8 eps in parallel)",
            "Auto-recap intros & Sarvam dub tracks per episode",
            "First & Last frame interpolation across scenes",
            "Wan 2.7 long-shot generation",
        ],
        "highlight": False,
        "engine_note": "Series pipeline · Wan 2.7 · Sora 2 · Sarvam dub. Ideal for content channels.",
    },
    "veded_team": {
        "id": "veded_team",
        "name": "Team / Studio",
        "price_usd": 199.0,
        "credits": {"image": 2500, "video": 250, "audio_chars": 1500000, "dubbing": 1000},
        "features": [
            "Everything in Web Series, plus:",
            "Long-Format Movie Compiler (30–60 min MP4)",
            "Automated Script-to-Movie · FFmpeg stitching",
            "5 shared seats ($25/extra seat)",
            "Shared cloud asset storage & workspace",
            "Highest priority GPU cluster · 4K master exports",
            "Audio lip-sync for avatars",
        ],
        "highlight": False,
        "engine_note": "Full engine access · lip-sync · movie compiler pipeline.",
    },
}

# BookStream subscription tiers
BOOKSTREAM_PLANS = {
    "bookstream_standard": {
        "id": "bookstream_standard",
        "name": "BookStream Standard",
        "price_usd": 7.49,
        "credits": {"dubbing": 100},
        "features": [
            "Unlimited audiobook streaming (default languages)",
            "20 AI web series episodes / mo",
            "100 monthly dubbing credits",
            "HD audio · 1080p video",
            "Offline downloads (up to 5 titles)",
        ],
        "highlight": False,
    },
    "bookstream_pro": {
        "id": "bookstream_pro",
        "name": "BookStream Pro",
        "price_usd": 14.99,
        "credits": {"dubbing": 300},
        "features": [
            "5 full-length AI movies / mo",
            "Unlimited audiobooks & short web series",
            "300 monthly dubbing credits (Sarvam AI)",
            "4K Ultra HD · Spatial audio",
            "Unlimited offline downloads · 2 screens",
        ],
        "highlight": True,
    },
    "bookstream_family": {
        "id": "bookstream_family",
        "name": "BookStream Family",
        "price_usd": 29.99,
        "credits": {"dubbing": 1000},
        "features": [
            "4 active profiles · 4 simultaneous screens",
            "Unlimited audiobooks, web series & movies",
            "1,000 shared monthly dubbing credits",
            "Kids profile filters",
            "Early access to new adaptations",
        ],
        "highlight": False,
    },
}

# One-time top-up packs
TOPUP_PACKS = {
    "topup_10": {"id": "topup_10", "name": "Creator Top-Up", "price_usd": 10.0, "cash_credit": 6.0, "image": 60, "video": 6,
                  "features": ["+60 image credits", "+6 video credits", "$6 API credit"]},
    "topup_50": {"id": "topup_50", "name": "Studio Top-Up", "price_usd": 50.0, "cash_credit": 25.0, "image": 300, "video": 30,
                  "features": ["+300 image credits", "+30 video credits", "$25 API credit"]},
    "pocket_pack": {"id": "pocket_pack", "name": "Pocket Dubbing Pack", "price_usd": 2.99, "dubbing": 50,
                     "features": ["+50 dubbing credits", "~10 video episode dubs", "OR 50 audio chapters"]},
    "binge_pack": {"id": "binge_pack", "name": "Binge Dubbing Pack", "price_usd": 7.49, "dubbing": 150,
                    "features": ["+150 dubbing credits", "~30 video episode dubs", "OR 6 full movie dubs"]},
    "ultimate_pack": {"id": "ultimate_pack", "name": "Ultimate Dubbing Pack", "price_usd": 19.49, "dubbing": 500,
                       "features": ["+500 dubbing credits", "Unlimited season dubbing", "Best margin & value"]},
}

ALL_PACKAGES = {**VEDED_PLANS, **BOOKSTREAM_PLANS, **TOPUP_PACKS}

# Cost per generation
GENERATION_COST = {
    "image": {"credit_field": "image_credits", "amount": 1},
    "video": {"credit_field": "video_credits", "amount": 1},
    "audio": {"credit_field": "audio_chars", "amount": 500},
    "dubbing": {"credit_field": "dubbing_credits", "amount": 5},
}

# Feature groups for the pricing page (marketing copy)
FEATURE_GROUPS = [
    {
        "title": "AI Image Creation",
        "icon": "image",
        "items": [
            "Multi-Engine Generation — FLUX Schnell, SDXL Turbo, Nano Banana Pro",
            "Soul ID — lock a character's face across every prompt & scene",
            "Image Canvas & Inpainting — brush regions to swap backgrounds, clothes, props",
        ],
    },
    {
        "title": "AI Video & Motion Studio",
        "icon": "video",
        "items": [
            "Text-to-Video & Image-to-Video — Sora 2, Kling 3.0, Veo 3.1, Wan 2.7",
            "Cinematic camera controls — dolly zooms, orbital spins, pan & tilt",
            "First & Last frame interpolation between two images",
            "4K upscaling & neural frame continuity",
        ],
    },
    {
        "title": "Voice & Audio Studio (Sarvam AI)",
        "icon": "mic",
        "items": [
            "Regional voiceovers (Bulbul v3) — 10+ Indian accents",
            "Voice swapping & audio translation while retaining tone",
            "Audio lip-syncing for generated avatars",
        ],
    },
    {
        "title": "Long-Format Movie Compiler",
        "icon": "clapperboard",
        "items": [
            "Automated Script-to-Movie engine — script → 5-second shots + voice",
            "FFmpeg stitching pipeline — crossfades, captions, transitions",
            "Serverless render farm compiles 30–60 min MP4 masters",
        ],
    },
]

BOOKSTREAM_CONTENT = [
    {"id": "the-neon-archive", "title": "The Neon Archive", "type": "web_series", "genre": "Sci-Fi Epic",
     "cover": "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800", "duration": "42:15", "views": "1.2M",
     "creator": "Elena Vance", "base_language": "en", "tags": ["4K CINEMATIC", "DOLBY ATMOS"],
     "description": "A hacker discovers her memories were engineered by a rogue AI archive."},
    {"id": "sands-of-silence", "title": "Sands of Silence", "type": "movie", "genre": "Dark Fantasy",
     "cover": "https://images.unsplash.com/photo-1519638399535-1b036603ac77?w=800", "duration": "1:12:04", "views": "890K",
     "creator": "Marcus Sterling", "base_language": "en", "tags": ["ASMR ENHANCED"],
     "description": "An ancient compass leads a desert nomad to the buried city of Ur."},
    {"id": "memory-pulse", "title": "Memory Pulse", "type": "audiobook", "genre": "Dystopian",
     "cover": "https://images.unsplash.com/photo-1541701494587-cb58502866ab?w=800", "duration": "6:24:00", "views": "540K",
     "creator": "Aria Chen", "base_language": "en", "tags": ["NARRATED"],
     "description": "In a world where memory can be traded, one librarian holds the last true story."},
    {"id": "midnight-signal", "title": "Midnight Signal", "type": "web_series", "genre": "Noir",
     "cover": "https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=800", "duration": "28:30", "views": "310K",
     "creator": "Rick Halloway", "base_language": "en", "tags": ["MOTION COMIC"],
     "description": "A detective decodes a numbers station broadcasting from 1974."},
    {"id": "the-digital-codex", "title": "The Digital Codex", "type": "audiobook", "genre": "History",
     "cover": "https://images.unsplash.com/photo-1533158326339-7f3cf2404354?w=800", "duration": "8:00:00", "views": "220K",
     "creator": "Dr. Yasmin Reyes", "base_language": "en", "tags": ["ASMR ENHANCED"],
     "description": "The origin of computing told through the eyes of the women who built it."},
    {"id": "the-glass-kingdom", "title": "The Glass Kingdom", "type": "movie", "genre": "Fantasy",
     "cover": "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&sat=-100", "duration": "1:48:22", "views": "1.5M",
     "creator": "Clara Vance", "base_language": "en", "tags": ["4K", "DOLBY ATMOS"],
     "description": "A princess forged of glass must survive a shattered kingdom."},
    {"id": "orions-pulse", "title": "Orion's Pulse", "type": "web_series", "genre": "Space Opera",
     "cover": "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800", "duration": "36:11", "views": "210K",
     "creator": "Leo Thorne", "base_language": "en", "tags": ["4K CINEMATIC"],
     "description": "A rescue crew answers a distress call from a derelict starship."},
    {"id": "steel-and-petals", "title": "Steel & Petals", "type": "audiobook", "genre": "Post-Apocalyptic",
     "cover": "https://images.unsplash.com/photo-1470813740244-df37b8c1edcb?w=800", "duration": "5:42:00", "views": "120K",
     "creator": "Sarah K.", "base_language": "en", "tags": ["NARRATED"],
     "description": "A florist grows the last garden on Earth inside a decaying steel mill."},
]

DUBBING_LANGUAGES = [
    {"code": "hi", "name": "Hindi", "accent": "North Indian"},
    {"code": "ta", "name": "Tamil", "accent": "Chennai"},
    {"code": "te", "name": "Telugu", "accent": "Hyderabad"},
    {"code": "bn", "name": "Bengali", "accent": "Kolkata"},
    {"code": "mr", "name": "Marathi", "accent": "Mumbai"},
    {"code": "gu", "name": "Gujarati", "accent": "Ahmedabad"},
    {"code": "kn", "name": "Kannada", "accent": "Bengaluru"},
    {"code": "ml", "name": "Malayalam", "accent": "Kochi"},
    {"code": "pa", "name": "Punjabi", "accent": "Amritsar"},
    {"code": "en-in", "name": "English (Indian)", "accent": "Neutral Indian"},
]
