import { ImageResponse } from "next/og";
import { getPost } from "@/lib/posts";
import { extractTitle, extractExcerpt, loadGoogleFont, toImageSrc, CABINET_SVG } from "@/lib/og-utils";

export const alt = "Post from The Archive of Small Things";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OGImage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const post = await getPost(id);

  if (!post) {
    return new Response("Not found", { status: 404 });
  }

  const [jostBold, courierPrime] = await Promise.all([
    loadGoogleFont("Jost", 700),
    loadGoogleFont("Courier Prime", 400),
  ]);

  const title = extractTitle(post);
  const excerpt = extractExcerpt(post);

  // Determine images to show (skip videos, featured first)
  const postImageUrls = post.images
    .filter((img) => !img.mimeType?.startsWith("video/"))
    .sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0))
    .map((img) => img.url);

  // Fall back to link preview image
  const linkPreviewImage = Object.values(post.linkPreviews).find(
    (lp) => lp.imageUrl,
  )?.imageUrl;
  const candidateUrls =
    postImageUrls.length > 0
      ? postImageUrls
      : linkPreviewImage
        ? [linkPreviewImage]
        : [];

  // Resolve image URLs to data URIs, taking up to 4 that succeed
  const resolvedImages: string[] = [];
  for (const url of candidateUrls) {
    if (resolvedImages.length >= 4) break;
    const src = await toImageSrc(url);
    console.log(`[OG] ${url} -> ${src ? 'OK (' + src.length + ' chars)' : 'FAILED'}`);
    if (src) resolvedImages.push(src);
  }
  console.log(`[OG] resolvedImages: ${resolvedImages.length}`);

  const hasImages = resolvedImages.length > 0;
  const titleFontSize = title.length > 60 ? 36 : title.length > 30 ? 48 : 56;

  // 60% of inner width (1120) = ~670
  const imgW = 670;
  const imgH = 550;
  // For 4+ layout: featured large on left, 3 small stacked on right
  const featuredW = Math.round(imgW * 0.6);
  const smallW = imgW - featuredW;
  const thirdH = Math.round(imgH / 3);

  let imageGrid = null;
  if (hasImages) {
    if (resolvedImages.length === 1) {
      imageGrid = (
        <img src={resolvedImages[0]} style={{ width: imgW, height: imgH, objectFit: "cover" }} />
      );
    } else if (resolvedImages.length === 2) {
      imageGrid = (
        <div style={{ display: "flex", width: imgW, height: imgH }}>
          <img src={resolvedImages[0]} style={{ width: Math.round(imgW / 2), height: imgH, objectFit: "cover" }} />
          <img src={resolvedImages[1]} style={{ width: Math.round(imgW / 2), height: imgH, objectFit: "cover" }} />
        </div>
      );
    } else if (resolvedImages.length === 3) {
      imageGrid = (
        <div style={{ display: "flex", width: imgW, height: imgH }}>
          <img src={resolvedImages[0]} style={{ width: featuredW, height: imgH, objectFit: "cover" }} />
          <div style={{ display: "flex", flexDirection: "column", width: smallW, height: imgH }}>
            <img src={resolvedImages[1]} style={{ width: smallW, height: Math.round(imgH / 2), objectFit: "cover" }} />
            <img src={resolvedImages[2]} style={{ width: smallW, height: Math.round(imgH / 2), objectFit: "cover" }} />
          </div>
        </div>
      );
    } else {
      // Featured large on left, 3 small stacked on right
      imageGrid = (
        <div style={{ display: "flex", width: imgW, height: imgH }}>
          <img src={resolvedImages[0]} style={{ width: featuredW, height: imgH, objectFit: "cover" }} />
          <div style={{ display: "flex", flexDirection: "column", width: smallW, height: imgH }}>
            <img src={resolvedImages[1]} style={{ width: smallW, height: thirdH, objectFit: "cover" }} />
            <img src={resolvedImages[2]} style={{ width: smallW, height: thirdH, objectFit: "cover" }} />
            <img src={resolvedImages[3]} style={{ width: smallW, height: imgH - thirdH * 2, objectFit: "cover" }} />
          </div>
        </div>
      );
    }
  }

  const titleStyle = {
    fontFamily: "Jost",
    fontSize: titleFontSize,
    fontWeight: 700,
    lineHeight: 1.2,
    display: "flex" as const,
    flexWrap: "wrap" as const,
  };

  return new ImageResponse(
    <div
      style={{
        width: 1200,
        height: 630,
        display: "flex",
        backgroundColor: "#ffb703",
        padding: 40,
      }}
    >
      <div
        style={{
          width: 1120,
          height: 550,
          display: "flex",
          backgroundColor: "#fdf5e6",
        }}
      >
      <div
        style={{
          width: hasImages ? 450 : 1120,
          height: 550,
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-start",
          padding: "80px 40px 40px 40px",
        }}
      >
        {/* Title with shadow — both in same relative container */}
        <div style={{ display: "flex", flexDirection: "column", position: "relative" }}>
          {/* Shadow layer — same size/position, offset by 3px */}
          <div
            style={{
              ...titleStyle,
              color: "rgba(44, 44, 44, 0.12)",
              position: "absolute",
              top: 3,
              left: 3,
            }}
          >
            {title}
          </div>
          {/* Main title */}
          <div style={{ ...titleStyle, color: "#2c2c2c" }}>
            {title}
          </div>
        </div>
        {/* Tags — hide when title was derived from a tag to avoid redundancy */}
        {post.tags.length > 0 && title !== post.tags[0]?.name && (
          <div
            style={{ display: "flex", gap: 8, marginTop: 20, flexWrap: "wrap" }}
          >
            {post.tags.slice(0, 3).map((tag) => (
              <div
                key={tag.id}
                style={{
                  display: "flex",
                  fontFamily: "Courier Prime",
                  fontSize: 16,
                  color: "#4682b4",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                #{tag.name}
              </div>
            ))}
          </div>
        )}
        {/* Excerpt + CTA */}
        {excerpt && (
          <div style={{ display: "flex", flexDirection: "column", marginTop: 24 }}>
            <div
              style={{
                display: "flex",
                fontFamily: "Courier Prime",
                fontSize: 16,
                color: "#2c2c2c",
                opacity: 0.6,
                lineHeight: 1.5,
              }}
            >
              {excerpt}
            </div>
            <div
              style={{
                display: "flex",
                marginTop: 16,
                fontFamily: "Jost",
                fontSize: 14,
                fontWeight: 700,
                color: "#c0392b",
                textTransform: "uppercase",
                letterSpacing: "0.1em",
              }}
            >
              Read more →
            </div>
          </div>
        )}
        {/* Branding — top left */}
        <div
          style={{
            position: "absolute",
            top: 24,
            left: 28,
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <img src={CABINET_SVG} width={42} height={42} />
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              fontFamily: "Jost",
              fontWeight: 700,
              color: "#c0392b",
              textTransform: "uppercase",
              lineHeight: 1,
            }}
          >
            <div style={{ display: "flex", fontSize: 20, letterSpacing: "0.02em" }}>The Archive</div>
            <div style={{ display: "flex", fontSize: 15, letterSpacing: "0.02em" }}>of Small Things</div>
          </div>
        </div>
      </div>
      {imageGrid}
      </div>
    </div>,
    {
      ...size,
      fonts: [
        {
          name: "Jost",
          data: jostBold,
          weight: 700 as const,
          style: "normal" as const,
        },
        {
          name: "Courier Prime",
          data: courierPrime,
          weight: 400 as const,
          style: "normal" as const,
        },
      ],
    },
  );
}
