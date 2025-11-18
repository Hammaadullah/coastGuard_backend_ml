import type { Express } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import { storage } from "./storage";

// Configure multer for file uploads
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Note: This is a proxy server that forwards requests to the existing backend API
// The actual backend services are already deployed and documented in the OpenAPI spec
// For development purposes, we'll create stub endpoints that return mock data

export async function registerRoutes(app: Express): Promise<Server> {
  // ============================================================================
  // AUTH ROUTES (Proxy to existing auth service)
  // ============================================================================
  
  app.post("/api/auth/register", async (req, res) => {
    try {
      // In production, this would forward to the real auth service
      // For now, return mock successful registration
      const { userName, email, password } = req.body;
      
      if (!userName || !email || !password) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      // Mock response matching the expected format
      res.status(201).json({
        token: "mock-jwt-token-" + Date.now(),
        user: {
          userId: Math.floor(Math.random() * 10000),
          userName,
          email,
          role: "citizen", // Default role for new users
        },
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ error: "Missing email or password" });
      }

      // Mock login - in production, would authenticate against real backend
      // Return different roles based on email for testing
      let role = "citizen";
      if (email.includes("official")) role = "official";
      if (email.includes("analyst")) role = "analyst";

      res.status(201).json({
        token: "mock-jwt-token-" + Date.now(),
        user: {
          userId: Math.floor(Math.random() * 10000),
          userName: email.split("@")[0],
          email,
          role,
        },
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/v1/profile/me", async (req, res) => {
    try {
      // Extract token from Authorization header
      const token = req.headers.authorization?.replace("Bearer ", "");
      
      if (!token) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      // Mock profile response
      res.json({
        userName: "Test User",
        email: "test@example.com",
        phone: "+1234567890",
        role: "citizen",
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ============================================================================
  // HOTSPOT ROUTES
  // ============================================================================
  
  app.get("/api/hotspots", async (req, res) => {
    try {
      // Mock hotspot data
      const hotspots = [
        {
          hotspotId: 1,
          location: { latitude: 37.7749, longitude: -122.4194 },
          radiusKm: 2.5,
          intensityScore: 0.85,
          dominantHazardTypeId: 1,
          dominantHazardTypeName: "Tsunami",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          hotspotId: 2,
          location: { latitude: 37.8044, longitude: -122.2712 },
          radiusKm: 1.8,
          intensityScore: 0.62,
          dominantHazardTypeId: 3,
          dominantHazardTypeName: "High Waves",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];

      res.json(hotspots);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ============================================================================
  // REPORT ROUTES
  // ============================================================================
  
  app.post("/api/v1/reports", upload.array("media", 4), async (req, res) => {
    try {
      const { text, type_id, latitude, longitude, location_name } = req.body;
      const files = req.files as Express.Multer.File[];
      
      // Validate required fields
      if (!latitude || !longitude) {
        return res.status(400).json({ error: "Latitude and longitude are required" });
      }

      if (!text && (!files || files.length === 0)) {
        return res.status(400).json({ error: "Either text or media is required" });
      }

      // Mock successful report creation
      const reportId = Math.floor(Math.random() * 10000);
      
      // In production, files would be uploaded to storage service
      const mediaUrls = files ? files.map((_, idx) => 
        `/api/media/${reportId}-${idx}.jpg`
      ) : [];
      
      res.status(201).json({
        reportId,
        mediaUrls,
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/v1/reports", async (req, res) => {
    try {
      // Mock report data
      const reports = [
        {
          reportId: 1,
          userId: 101,
          userName: "John Doe",
          hazardTypeId: 1,
          hazardTypeName: "Tsunami",
          description: "Unusual wave patterns observed near the coast. Water receding rapidly.",
          location: { latitude: 37.7749, longitude: -122.4194 },
          locationName: "San Francisco Bay",
          sentimentId: 4,
          sentimentName: "urgent",
          relevanceScore: 0.92,
          reportTime: new Date(Date.now() - 3600000).toISOString(),
          mediaUrls: [],
          status: "not_verified",
          verifiedBy: null,
          createdAt: new Date(Date.now() - 3600000).toISOString(),
          updatedAt: null,
        },
        {
          reportId: 2,
          userId: 102,
          userName: "Jane Smith",
          hazardTypeId: 3,
          hazardTypeName: "High Waves",
          description: "Waves reaching 15-20 feet, dangerous for small vessels.",
          location: { latitude: 37.8044, longitude: -122.2712 },
          locationName: "Oakland Marina",
          sentimentId: 3,
          sentimentName: "negative",
          relevanceScore: 0.87,
          reportTime: new Date(Date.now() - 7200000).toISOString(),
          mediaUrls: [],
          status: "community_verified",
          verifiedBy: null,
          createdAt: new Date(Date.now() - 7200000).toISOString(),
          updatedAt: null,
        },
        {
          reportId: 3,
          userId: 103,
          userName: "Mike Johnson",
          hazardTypeId: 4,
          hazardTypeName: "Coastal Flooding",
          description: "Parking lot near pier is flooding. Water level rising.",
          location: { latitude: 37.7694, longitude: -122.3859 },
          locationName: "Embarcadero",
          sentimentId: 3,
          sentimentName: "negative",
          relevanceScore: 0.78,
          reportTime: new Date(Date.now() - 10800000).toISOString(),
          mediaUrls: [],
          status: "officially_verified",
          verifiedBy: 201,
          createdAt: new Date(Date.now() - 10800000).toISOString(),
          updatedAt: new Date(Date.now() - 9000000).toISOString(),
        },
      ];

      res.json(reports);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/v1/reports/mine", async (req, res) => {
    try {
      const token = req.headers.authorization?.replace("Bearer ", "");
      
      if (!token) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      // Mock user's reports
      const reports = [
        {
          reportId: 101,
          userId: 999,
          userName: "Current User",
          hazardTypeId: 2,
          hazardTypeName: "Storm Surge",
          description: "Strong storm surge observed during high tide. Water approaching seawall.",
          location: { latitude: 37.7749, longitude: -122.4194 },
          locationName: "Ocean Beach",
          sentimentId: 4,
          sentimentName: "urgent",
          relevanceScore: 0.89,
          reportTime: new Date(Date.now() - 1800000).toISOString(),
          mediaUrls: [],
          status: "not_verified",
          verifiedBy: null,
          createdAt: new Date(Date.now() - 1800000).toISOString(),
          updatedAt: null,
        },
      ];

      res.json(reports);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.patch("/api/v1/verify-user-report/:report_id", async (req, res) => {
    try {
      const token = req.headers.authorization?.replace("Bearer ", "");
      
      if (!token) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const reportId = parseInt(req.params.report_id);
      
      // Mock verification response
      res.json({
        success: true,
        report: {
          reportId,
          status: "officially_verified",
          verifiedBy: 201,
          updatedAt: new Date().toISOString(),
        },
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.patch("/api/v1/debunk-user-report/:report_id", async (req, res) => {
    try {
      const token = req.headers.authorization?.replace("Bearer ", "");
      
      if (!token) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const reportId = parseInt(req.params.report_id);
      
      // Mock debunk response
      res.json({
        success: true,
        report: {
          reportId,
          status: "debunked",
          verifiedBy: 201,
          updatedAt: new Date().toISOString(),
        },
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ============================================================================
  // SOCIAL MEDIA ROUTES
  // ============================================================================
  
  app.get("/api/v1/social-posts", async (req, res) => {
    try {
      const token = req.headers.authorization?.replace("Bearer ", "");
      
      if (!token) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      // Mock social media posts
      const posts = [
        {
          postId: 1,
          platformId: 1,
          platformName: "twitter",
          authorName: "@coastwatch",
          content: "🌊 Large swells hitting the north shore. Advising all beach goers to exercise extreme caution. #CoastalSafety",
          locationName: "North Shore",
          location: { latitude: 37.8199, longitude: -122.4783 },
          status: "not_verified",
          verifiedBy: null,
          hazardTypeId: 3,
          hazardTypeName: "High Waves",
          mediaUrls: [],
          postTime: new Date(Date.now() - 5400000).toISOString(),
          sentimentId: 3,
          sentimentName: "negative",
          relevanceScore: 0.83,
          createdAt: new Date(Date.now() - 5400000).toISOString(),
          updatedAt: null,
        },
        {
          postId: 2,
          platformId: 1,
          platformName: "twitter",
          authorName: "@localnews",
          content: "Breaking: Coastal flooding reported in multiple locations. Emergency services responding.",
          locationName: "Downtown",
          location: { latitude: 37.7749, longitude: -122.4194 },
          status: "community_verified",
          verifiedBy: null,
          hazardTypeId: 4,
          hazardTypeName: "Coastal Flooding",
          mediaUrls: [],
          postTime: new Date(Date.now() - 7200000).toISOString(),
          sentimentId: 4,
          sentimentName: "urgent",
          relevanceScore: 0.94,
          createdAt: new Date(Date.now() - 7200000).toISOString(),
          updatedAt: null,
        },
      ];

      res.json(posts);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.patch("/api/v1/verify-social-media-post/:post_id", async (req, res) => {
    try {
      const token = req.headers.authorization?.replace("Bearer ", "");
      
      if (!token) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const postId = parseInt(req.params.post_id);
      
      res.json({
        success: true,
        post: {
          postId,
          status: "officially_verified",
          verifiedBy: 201,
          updatedAt: new Date().toISOString(),
        },
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.patch("/api/v1/debunk-social-media-post/:post_id", async (req, res) => {
    try {
      const token = req.headers.authorization?.replace("Bearer ", "");
      
      if (!token) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const postId = parseInt(req.params.post_id);
      
      res.json({
        success: true,
        post: {
          postId,
          status: "debunked",
          verifiedBy: 201,
          updatedAt: new Date().toISOString(),
        },
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
