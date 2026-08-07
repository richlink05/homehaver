export function renderContentWithMedia(content: string): string {
  if (!content) return "";
  let html = content
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  html = html.replace(
    /https?:\/\/(?:www\.)?(?:youtube\.com\/(?:watch\?v=|shorts\/)|youtu\.be\/)([\w-]{6,})\S*/g,
    (m, videoId) =>
      `<div class="video-embed"><iframe src="https://www.youtube.com/embed/${videoId}" title="YouTube video" frameborder="0" allowfullscreen></iframe></div>`
  );

  html = html.replace(
    /https?:\/\/(?:www\.)?vimeo\.com\/(\d+)\S*/g,
    (m, videoId) =>
      `<div class="video-embed"><iframe src="https://player.vimeo.com/video/${videoId}" title="Vimeo video" frameborder="0" allowfullscreen></iframe></div>`
  );

  html = html.replace(
    /https?:\/\/\S+\.(?:mp4|webm|ogg)(\?\S*)?/gi,
    (m) => `<video class="video-embed-native" controls src="${m}"></video>`
  );

  return html.replace(/\n/g, "<br/>");
}
