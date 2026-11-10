import type { Album } from '../types/portfolio';

export const albums: Album[] = [
{
  id: 'a-team',
  name: 'Team & Culture',
  photos: [
  { id: 'ph1', url: "/353810be-dffb-4b0b-bd8d-89af32855590.jpg", caption: 'Product squad at HQ', date: '2026-09-12' },
  { id: 'ph2', url: "/75e137fa-e385-452d-9729-84956cb5f485.jpg", caption: 'Summer offsite 2026', date: '2026-07-03' },
  { id: 'ph3', url: "/99366faa-1044-4690-ae6e-edd5ac544883.jpg", caption: 'Hardware lab prototyping', date: '2026-06-18' }]

},
{
  id: 'a-events',
  name: 'Events',
  photos: [
  { id: 'ph4', url: "/c2dadc2f-f407-4200-ac72-7e41f5120a2b.jpg", caption: 'Orbit Fleet 3.0 launch keynote', date: '2026-05-21' },
  { id: 'ph5', url: "/c00994f1-b7b4-4015-8e4c-f1d176f35d41.jpg", caption: 'Booth at Tech Expo Paris', date: '2026-04-09' }]

}];