// Timestamp helpers kept for compatibility with components that still call
// `formatTimestamp` (e.g. blog-detail). In the dummy-data phase all dates are
// plain `Date`, so this mostly passes values through unchanged.

export type TTimestamp = {
	toDate: () => Date;
	seconds: number;
	nanoseconds: number;
};

export const formatTimestamp = (timestamp: TTimestamp | Date | null | undefined): Date => {
	if (timestamp instanceof Date) {
		return timestamp;
	}

	if (timestamp && typeof timestamp.toDate === "function") {
		return timestamp.toDate();
	}

	return new Date();
};
