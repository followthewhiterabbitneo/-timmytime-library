export type TrackedItem = {
  id: string;
  name: string;
  barcode: string;
  photoUri: string;
  anchor: {
    latitude: number;
    longitude: number;
  };
  /** Alert radius in meters. Default is ~305m (1000 ft). */
  alertRadiusMeters: number;
  createdAt: number;
  /** True once the user has already been alerted for this item. */
  alerted: boolean;
};

export const DEFAULT_ALERT_RADIUS_METERS = 305;
