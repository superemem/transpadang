// Trans Padang — lokasi user via browser Geolocation API.
import { browser } from '$app/environment';

type LocStatus = 'idle' | 'loading' | 'granted' | 'denied' | 'unavailable';

class UserLocation {
	lat = $state<number | null>(null);
	lon = $state<number | null>(null);
	status = $state<LocStatus>('idle');

	get has() {
		return this.lat !== null && this.lon !== null;
	}

	/** Minta lokasi sekarang. Resolve {lat,lon} atau null kalau gagal/ditolak. */
	request(): Promise<{ lat: number; lon: number } | null> {
		return new Promise((resolve) => {
			if (!browser || !('geolocation' in navigator)) {
				this.status = 'unavailable';
				resolve(null);
				return;
			}
			this.status = 'loading';
			navigator.geolocation.getCurrentPosition(
				(pos) => {
					this.lat = pos.coords.latitude;
					this.lon = pos.coords.longitude;
					this.status = 'granted';
					resolve({ lat: this.lat, lon: this.lon });
				},
				() => {
					this.status = 'denied';
					resolve(null);
				},
				{ enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
			);
		});
	}
}

export const userLoc = new UserLocation();
