import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { z } from "zod";
import {
  parseVideoId,
  getVideoInfo,
  getDanmaku,
  convertToAss,
  getDanmakuStats,
  type AssOptions,
} from "./bilibili";
import { getDb } from "./db";
import { exportHistory } from "../drizzle/schema";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  danmaku: router({
    /**
     * Parse video URL and get video info
     */
    getVideoInfo: publicProcedure
      .input(
        z.object({
          url: z.string().min(1, "Video URL is required"),
        })
      )
      .mutation(async ({ input }) => {
        const videoId = parseVideoId(input.url);
        if (!videoId) {
          throw new Error("Invalid Bilibili video URL or ID");
        }

        const videoInfo = await getVideoInfo(videoId);
        return videoInfo;
      }),

    /**
     * Export danmaku to ASS format
     */
    exportDanmaku: publicProcedure
      .input(
        z.object({
          cid: z.number(),
          videoId: z.string(),
          videoTitle: z.string().optional(),
          options: z.object({
            width: z.number().default(1920),
            height: z.number().default(1080),
            fontName: z.string().default("Arial"),
            fontSize: z.number().default(25),
            alpha: z.number().min(0).max(1).default(0.8),
            durationMarquee: z.number().default(5),
            durationStill: z.number().default(5),
            reduceComments: z.boolean().default(false),
            danmakuCoverage: z.enum(["full", "half", "quarter"]).default("full"),
          }),
        })
      )
      .mutation(async ({ input }) => {
        // Get danmaku data
        const danmakuList = await getDanmaku(input.cid);

        // Get statistics
        const stats = getDanmakuStats(danmakuList);

        // Convert to ASS
        const assContent = convertToAss(danmakuList, input.options as AssOptions);

        // Save export history (optional)
        try {
          const db = await getDb();
          if (db) {
            await db.insert(exportHistory).values({
              videoId: input.videoId,
              videoTitle: input.videoTitle || null,
              danmakuCount: stats.total,
            });
          }
        } catch (error) {
          console.error("Failed to save export history:", error);
          // Continue even if history save fails
        }

        return {
          assContent,
          stats,
        };
      }),

    /**
     * Get danmaku statistics without exporting
     */
    getStats: publicProcedure
      .input(
        z.object({
          cid: z.number(),
        })
      )
      .query(async ({ input }) => {
        const danmakuList = await getDanmaku(input.cid);
        return getDanmakuStats(danmakuList);
      }),
  }),
});

export type AppRouter = typeof appRouter;
