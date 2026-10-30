import type { APIRoute } from 'astro';
import { getSitemap } from '@hejiu/build-tools';

export const prerender = true;

export const GET: APIRoute = () =>
  new Response(getSitemap('guide'), {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  });
