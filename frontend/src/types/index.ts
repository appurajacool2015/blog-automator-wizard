export interface Category {
  id: string;
  name: string;
}

export interface Channel {
  id: string;
  name: string;
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
  videoId: string;
  title: string;
  description: string;
  thumbnail: string;
  publishedAt: string;
  transcript: string;
  summary: string;
  error: string | null;
}
