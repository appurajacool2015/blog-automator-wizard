export interface Category {
  id: string;
  name: string;
}

export interface Channel {
  id: string;
  name: string;
  youtubeId: string;
  categoryId: string;
}

export interface Video {
  id: string;
  title: string;
  videoId: string;
  channelId: string;
  thumbnail: string;
  publishedAt: string;
}

export interface VideoDetails {
  id: string;
  title: string;
  videoId: string;
  summary: string;
  transcript: string;
  language: string;
  error?: string | null;
}
