import { Router } from "express";
import bcrypt from "bcryptjs";
import { z} from "zod";
import  { prisma} from "../lib/prisma.js";
import { DEFAULT_ISLAMIC_CATEGORIES} from  "../lib/defaultCategories.js";
import { 
    requireAuth,
    signAuthToken,
    type AuthRequest,
} from "../middleware/requireAuth.js";


const router = Router();

const registerSchema = z.object({
    name: z.string().trim().min(2, "Name must be at least 2 characters").max(80),
    email: z.string().trim().email("Please enter a valid email").toLowerCase
(),
   password: z
.string()
.min(6, "Password must be at least 6 characters")
.max(100),
});

const loginSchema = z.object ({
    email : z.string().trim().email("Please enter a valid email").toLowerCase(),
    password: z.string().min(1, "Password is required"),


});


//POST /api/auth/register
router.post("/register", async (req, res) => {
    const parsed = registerSchema.safeParse(req.body);
    if ( !parsed.success) {
        res.status(400).json({ error: 
            parsed.error.issues[0].message 
        });
        return;
    }

    const { name, email, password } = parsed.data;

    try {
        const existing= await prisma.user.findUnique({ where: {
            email 
        }});
        if (existing) {
            res.status(409).json({ error: "An account with this email already exists"});
            return;

        }

        const passwordHash = await bcrypt.hash(password, 10);

        // Create user + seed the 5 default Islamic categories together
        const user = await prisma.$transaction(async (tx) => {
            const createdUser = await tx.user.create({
                data: {
                    name,
                    email,
                    passwordHash,
                    categories : {
                        create: DEFAULT_ISLAMIC_CATEGORIES,
                    },
        
                },
                select: {
                    id: true,
                    name: true,
                    email: true,
                    themePreference: true,
                    createdAt: true,
                },
            });
            return createdUser;
        });

        const token = signAuthToken(user.id);
        res.status(201).json({ token, user});
    } catch (err) {
        console.error("Register error: ", err);
        res.status(500).json({ error: "Could not create account. Please try again."});

    }
});

// POST /api/auth/login
router.post("/login", async (req,res) => {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
        res.status(400).json({ error: 
            parsed.error.issues[0].message
        });
        return;
    }

    const { email, password} = parsed.data;

    try {
        const user = await prisma.user.findUnique({ where: { email}});
        if (!user) {
            res.status(401).json({ error : "Invalid email or password"});
            return;

        }

        const valid = await bcrypt.compare(password, user.passwordHash);
        if ( !valid) {
            res.status(401).json({ error: "Invalid email or password"});
            return;
        }

        const token = signAuthToken(user.id);
        res.json({ 
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                themePreference: user.themePreference,
                createdAt: user.createdAt,
            },
        });


    } catch (err) {
        console.error("Login error:", err);
        res.status(500).json({ error: "Could not log in. Please try again"});

    }
});


// GET /api/auth/me
router.get("/me", requireAuth, async (req: AuthRequest, res) => {
    try { 
        const user = await prisma.user.findUnique({ 
            where: {id : req.userId},
            select : {
                id: true,
                name: true,
                email: true,
                themePreference: true,
                createdAt: true,
            },
        });

        if (!user) {
            res.status(404).json({ error: "User not found"});
            return;
        }

        res.json({ user}) ;

    } catch (err) {
        console.error(" Me error:", err);
        res.status(500).json({ error: "Failed to fetch profile"});

    }

});

// PATCH /api/auth/theme
router.patch("/theme", requireAuth, async (req: AuthRequest, res) => {
  const theme = req.body?.themePreference;
  if (!["light", "dark", "system"].includes(theme)) {
    res.status(400).json({ error: "Invalid theme value" });
    return;
  }

  try {
    const user = await prisma.user.update({
      where: { id: req.userId },
      data: { themePreference: theme },
      select: { id: true, themePreference: true },
    });
    res.json({ user });
  } catch (err) {
    console.error("Theme update error:", err);
    res.status(500).json({ error: "Failed to update theme" });
  }
});

export default router;