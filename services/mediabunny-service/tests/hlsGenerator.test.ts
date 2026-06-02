import { describe, test, expect, beforeAll, afterAll } from "bun:test";
import { HLSGenerator } from "../src/hls/generator.js";
import { mkdir, rm, readFile } from "fs/promises";
import { join } from "path";

describe("HLSGenerator", () => {
  const testDir = "./test-output";

  beforeAll(async () => {
    await mkdir(testDir, { recursive: true });
  });

  afterAll(async () => {
    await rm(testDir, { recursive: true, force: true });
  });

  test("should generate HLS playlist", async () => {
    const generator = new HLSGenerator();
    await generator.generate("http://example.com/video.mp4", testDir, {
      segmentDuration: 6,
      playlistSize: 5,
    });

    const playlist = await readFile(join(testDir, "playlist.m3u8"), "utf-8");
    expect(playlist).toContain("#EXTM3U");
    expect(playlist).toContain("#EXT-X-VERSION:3");
    expect(playlist).toContain("#EXT-X-TARGETDURATION:6");
    expect(playlist).toContain("segment_0.ts");
    expect(playlist).toContain("segment_4.ts");
    expect(playlist).toContain("#EXT-X-ENDLIST");
  });

  test("should generate segment files", async () => {
    const generator = new HLSGenerator();
    await generator.generate("http://example.com/video.mp4", testDir, {
      segmentDuration: 6,
      playlistSize: 3,
    });

    for (let i = 0; i < 3; i++) {
      const segment = await readFile(join(testDir, `segment_${i}.ts`), "utf-8");
      expect(segment).toBeDefined();
    }
  });
});
