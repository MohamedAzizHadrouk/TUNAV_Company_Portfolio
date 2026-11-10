import type { HardwareItem } from '../types/portfolio';

const datasheet = { kind: 'file' as const, value: 'data:text/plain;base64,RGF0YXNoZWV0', fileName: 'technical-datasheet.txt' };

export const hardware: HardwareItem[] = [
{
  id: 'h1', title: 'Orbit T2 4G Tracker', description: 'GPS tracker with LTE-M, IP67 enclosure.', purchasePrice: 42,
  assignments: [{ productId: 'p-orbit', salePrice: 89 }, { productId: 'p-pulse', salePrice: 99 }],
  document: datasheet, addedAt: '2026-02-10'
},
{ id: 'h2', title: 'CAN-bus OBD-II Reader', description: 'Reads engine data and fuel consumption.', purchasePrice: 18, assignments: [{ productId: 'p-orbit', salePrice: 39 }], document: null, addedAt: '2026-02-10' },
{ id: 'h3', title: 'Nova Edge Gateway unit', description: 'ARM quad-core, dual Ethernet + LTE, DIN-rail.', purchasePrice: 310, assignments: [{ productId: 'p-nova', salePrice: 690 }], document: datasheet, addedAt: '2025-05-02' },
{ id: 'h4', title: 'MacBook Pro 16" M4', description: 'Lead developer workstation.', purchasePrice: 3299, assignments: [], document: null, addedAt: '2025-11-04' },
{ id: 'h5', title: 'Dell PowerEdge R760', description: 'On-premise build and staging server.', purchasePrice: 8900, assignments: [], document: datasheet, addedAt: '2025-03-19' },
{ id: 'h6', title: 'Ubiquiti Dream Machine Pro', description: 'Office network gateway.', purchasePrice: 379, assignments: [], document: null, addedAt: '2024-09-01' },
{ id: 'h7', title: 'Orbit T2 demo kit', description: 'Spare trackers used for sales demos.', purchasePrice: 210, assignments: [], document: null, addedAt: '2026-03-01' }];