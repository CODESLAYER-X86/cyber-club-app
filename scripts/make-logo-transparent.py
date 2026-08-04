#!/usr/bin/env python3
"""
Make the background of a logo transparent while preserving internal white/light pixels.

Strategy: Flood-fill from all edge pixels. Any pixel reachable from the edges
that is "light enough" (background-like) gets its alpha set to 0.
Pixels inside the logo shape that happen to be light are NOT touched
because they're enclosed by the logo boundary and unreachable from edges.
"""

from PIL import Image
import sys

INPUT = "/home/z/my-project/upload/Gemini_Generated_Image_.png"
OUTPUT = "/home/z/my-project/public/certificate/logo.png"

# Threshold: pixels with all RGB channels >= this value are considered "background-like"
BG_THRESHOLD = 180

def main():
    img = Image.open(INPUT).convert("RGBA")
    w, h = img.size
    pixels = img.load()

    # Create a visited map (bool array)
    visited = [[False] * h for _ in range(w)]

    # BFS flood fill from edge pixels that look like background
    from collections import deque
    queue = deque()

    # Seed from all 4 edges
    for x in range(w):
        for y in [0, h - 1]:
            r, g, b, a = pixels[x, y]
            if r >= BG_THRESHOLD and g >= BG_THRESHOLD and b >= BG_THRESHOLD and a > 0:
                if not visited[x][y]:
                    visited[x][y] = True
                    queue.append((x, y))

    for y in range(h):
        for x in [0, w - 1]:
            r, g, b, a = pixels[x, y]
            if r >= BG_THRESHOLD and g >= BG_THRESHOLD and b >= BG_THRESHOLD and a > 0:
                if not visited[x][y]:
                    visited[x][y] = True
                    queue.append((x, y))

    print(f"Seeded {len(queue)} edge pixels")

    # 4-connected flood fill
    filled = 0
    while queue:
        x, y = queue.popleft()
        filled += 1

        # Make this pixel transparent
        r, g, b, a = pixels[x, y]
        pixels[x, y] = (r, g, b, 0)

        # Check 4 neighbors
        for dx, dy in [(-1, 0), (1, 0), (0, -1), (0, 1)]:
            nx, ny = x + dx, y + dy
            if 0 <= nx < w and 0 <= ny < h and not visited[nx][ny]:
                nr, ng, nb, na = pixels[nx, ny]
                if nr >= BG_THRESHOLD and ng >= BG_THRESHOLD and nb >= BG_THRESHOLD and na > 0:
                    visited[nx][ny] = True
                    queue.append((nx, ny))

    print(f"Flood-filled {filled} background pixels as transparent")

    # Also do a second pass: any remaining pixel that is very light (near-white)
    # and touches a transparent pixel from the flood fill — this catches anti-aliased edges
    # But ONLY if it's reachable from the already-transparent region
    aa_pass = 0
    # Re-seed: any transparent pixel that has a non-transparent light neighbor
    for x in range(w):
        for y in range(h):
            r, g, b, a = pixels[x, y]
            if a == 0:  # already transparent
                for dx, dy in [(-1, 0), (1, 0), (0, -1), (0, 1)]:
                    nx, ny = x + dx, y + dy
                    if 0 <= nx < w and 0 <= ny < h:
                        nr, ng, nb, na = pixels[nx, ny]
                        # Softer threshold for anti-aliased edges
                        if na > 0 and nr >= 150 and ng >= 150 and nb >= 150:
                            if not visited[nx][ny]:
                                visited[nx][ny] = True
                                queue.append((nx, ny))

    while queue:
        x, y = queue.popleft()
        r, g, b, a = pixels[x, y]
        pixels[x, y] = (r, g, b, 0)
        aa_pass += 1

        for dx, dy in [(-1, 0), (1, 0), (0, -1), (0, 1)]:
            nx, ny = x + dx, y + dy
            if 0 <= nx < w and 0 <= ny < h and not visited[nx][ny]:
                nr, ng, nb, na = pixels[nx, ny]
                if na > 0 and nr >= 150 and ng >= 150 and nb >= 150:
                    visited[nx][ny] = True
                    queue.append((nx, ny))

    print(f"Anti-alias pass: made {aa_pass} more pixels transparent")

    img.save(OUTPUT, "PNG")
    print(f"Saved transparent logo to {OUTPUT}")

    # Verify: count transparent vs non-transparent pixels
    trans = 0
    opaque = 0
    for x in range(w):
        for y in range(h):
            _, _, _, a = pixels[x, y]
            if a == 0:
                trans += 1
            else:
                opaque += 1
    total = w * h
    print(f"Result: {trans} transparent ({trans*100/total:.1f}%), {opaque} opaque ({opaque*100/total:.1f}%)")

if __name__ == "__main__":
    main()
