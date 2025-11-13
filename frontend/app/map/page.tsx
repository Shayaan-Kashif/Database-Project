'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  MapContainer,
  TileLayer,
  Polygon,
  Popup,
} from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L, { LatLngExpression } from 'leaflet';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { IconArrowLeft } from "@tabler/icons-react";

// Fix missing marker icons in Next.js
const DefaultIcon = L.icon({
  iconUrl: '/marker-icon.png',
  shadowUrl: '/marker-shadow.png',
});
L.Marker.prototype.options.icon = DefaultIcon;

// Types
interface ParkingLot {
  id: string;
  coordinates: LatLngExpression[];
  color: string;
}

interface LotDetails {
  id: string;
  name: string;
  slots: number;
  occupiedSlots?: number;
  ocupiedSlots?: number;
}

interface Review {
  userID: string;
  username: string;
  lotID: string;
  lotName: string;
  title: string;
  description: {
    String: string;
    Valid: boolean;
  };
  score: number;
  createdAt: string;
  updatedAt: string;
}

const parkingLots: ParkingLot[] = [
  {
    id: 'Founders 5',
    coordinates: [
      [43.9522620, -78.8994775],
      [43.9524640, -78.8986061],
      [43.9517503, -78.8982960],
      [43.9515333, -78.8992063],
    ],
    color: 'blue',
  },
  {
    id: 'Founders 2',
    coordinates: [
      [43.9469547, -78.8991157],
      [43.9476579, -78.8963413],
      [43.9474117, -78.8959742],
      [43.9466013, -78.8948175],
      [43.9462709, -78.8957264],
      [43.9468266, -78.8960067],
      [43.9461859, -78.8988475],
    ],
    color: 'green',
  },
  {
    id: 'Founders 4',
    coordinates: [
      [43.9500923, -78.8985136],
      [43.9502584, -78.8976673],
      [43.9496380, -78.8973582],
      [43.9493981, -78.8982373],
    ],
    color: 'orange',
  },
  {
    id: 'Founders 3',
    coordinates: [
      [43.9483961, -78.8987647],
      [43.9484897, -78.8983637],
      [43.9478795, -78.8981371],
      [43.9478032, -78.8985153],
    ],
    color: 'black',
  },
  {
    id: 'Founders 1',
    coordinates: [
      [43.9460000, -78.8956993],
      [43.9460823, -78.8953781],
      [43.9449244, -78.8948762],
      [43.9448746, -78.8942083],
      [43.9446393, -78.8940819],
      [43.9444411, -78.8949888],
    ],
    color: 'purple',
  },

  {
    id: 'Commencement',
    coordinates: [
      [43.9423638, -78.8961019],
      [43.9426865, -78.8944178],
      [43.9411188, -78.8936571],
      [43.9406545, -78.8954924],
      [43.9414881, -78.8959799],
      [43.9413935, -78.8963745],
      [43.9419461, -78.8966357],
      [43.9421021, -78.8960201],
    ],
    color: 'brown',
  },


];

export default function Map() {
  const router = useRouter();

  const [selectedLot, setSelectedLot] = useState<string | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  const [lotDetails, setLotDetails] = useState<LotDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [reviews, setReviews] = useState<Review[] | null>(null);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [reviewsError, setReviewsError] = useState<string | null>(null);

  const handleLotClick = (lotId: string) => {
    setSelectedLot(lotId);
    setIsSheetOpen(true);
  };

  // Fetch lot details
  useEffect(() => {
    let aborted = false;

    async function fetchLots() {
      if (!selectedLot || !isSheetOpen) return;

      setLoading(true);
      setError(null);
      setLotDetails(null);

      try {
        const res = await fetch("http://localhost:8080/api/parkingLots", {
          cache: "no-store",
          credentials: "include",
        });

        if (!res.ok) throw new Error(`Request failed: ${res.status}`);

        const data: LotDetails[] = await res.json();
        if (aborted) return;

        const match = data.find((d) => d.name === selectedLot);

        if (!match) {
          setError("No data found for this lot.");
        } else {
          setLotDetails(match);
        }
      } catch (e: any) {
        if (!aborted) setError(e?.message ?? "Failed to load lot data");
      } finally {
        if (!aborted) setLoading(false);
      }
    }

    fetchLots();
    return () => {
      aborted = true;
    };
  }, [selectedLot, isSheetOpen]);

  // Fetch reviews after lotDetails loads
  useEffect(() => {
    let aborted = false;

    async function fetchReviews() {
      if (!lotDetails) return;

      setReviews(null);
      setReviewsLoading(true);
      setReviewsError(null);

      try {
        const res = await fetch(
          `http://localhost:8080/api/reviews/${lotDetails.id}`,
          {
            cache: "no-store",
            credentials: "include",
          }
        );

        if (!res.ok) throw new Error(`Failed to load reviews: ${res.status}`);

        const data: Review[] = await res.json();
        if (!aborted) setReviews(data);
      } catch (e: any) {
        if (!aborted) setReviewsError(e?.message ?? "Error loading reviews");
      } finally {
        if (!aborted) setReviewsLoading(false);
      }
    }

    fetchReviews();
    return () => {
      aborted = true;
    };
  }, [lotDetails]);

  const occupied =
    lotDetails?.occupiedSlots ??
    lotDetails?.ocupiedSlots ??
    0;

  return (
    <div className="relative h-screen w-full rounded-lg overflow-hidden">
      
      {/* Back Button */}
      <div className="absolute top-[85px] left-4 z-[1000]">
        <Button
          onClick={() => router.push('/dashboard')}
          variant="outline"
          className="bg-background/90 backdrop-blur-sm shadow-md hover:bg-background"
        >
          <IconArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Button>
      </div>

      {/* Sidebar */}
      <Sheet
        open={isSheetOpen}
        onOpenChange={(open) => {
          setIsSheetOpen(open);
          if (!open) {
            setSelectedLot(null);
            setLotDetails(null);
            setReviews(null);
          }
        }}
      >
        <SheetContent side="right" className="w-[400px] overflow-y-auto">
          
          {selectedLot ? (
            <>
              <SheetHeader>
                <SheetTitle>{selectedLot}</SheetTitle>
                <SheetDescription>
                  Viewing details for <strong>{selectedLot}</strong>.
                </SheetDescription>
              </SheetHeader>

              {/* Lot Details */}
              <div className="mt-4 space-y-3">
                {loading && <p>Loading...</p>}
                {error && <p className="text-red-600">{error}</p>}
                {!loading && !error && lotDetails && (
                  <>
                    <p>Total Slots: {lotDetails.slots}</p>
                    <p>Occupied: {occupied}</p>
                    <p>Available: {Math.max(0, lotDetails.slots - occupied)}</p>
                    <Button className="w-full">Write a Review</Button>
                  </>
                )}
              </div>

              {/* Reviews Section */}
              <div className="mt-6 pt-4 border-t">
                <h3 className="text-lg font-semibold mb-2">Reviews</h3>

                {reviewsLoading && <p>Loading reviews...</p>}
                {reviewsError && <p className="text-red-600">{reviewsError}</p>}

                {!reviewsLoading &&
                  !reviewsError &&
                  reviews &&
                  reviews.length === 0 && <p>No reviews yet.</p>}

                {!reviewsLoading &&
                  !reviewsError &&
                  reviews &&
                  reviews.length > 0 && (
                    <div className="space-y-3">
                      {reviews.map((rev) => (
                        <div
                          key={`${rev.userID}-${rev.createdAt}`}
                          className="p-3 rounded border bg-muted/30"
                        >
                          <p className="font-semibold">{rev.username}</p>

                          <p className="font-medium">⭐ {rev.score}/5</p>

                          <p className="text-lg font-bold mt-1">{rev.title}</p>

                          {rev.description.Valid && (
                            <p className="text-sm mt-1 whitespace-pre-wrap">
                              {rev.description.String}
                            </p>
                          )}

                          <p className="text-xs text-muted-foreground mt-2">
                            Created: {new Date(rev.createdAt).toLocaleString()}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Updated: {new Date(rev.updatedAt).toLocaleString()}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
              </div>
            </>
          ) : (
            <p>No lot selected.</p>
          )}
        </SheetContent>
      </Sheet>

      {/* Map */}
      <MapContainer
        center={[43.948, -78.897]}
        zoom={16}
        scrollWheelZoom={true}
        className="h-full w-full z-0"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {parkingLots.map((lot) => (
          <Polygon
            key={lot.id}
            positions={lot.coordinates as LatLngExpression[]}
            pathOptions={{
              color: selectedLot === lot.id ? 'red' : lot.color,
              fillColor: selectedLot === lot.id ? 'red' : lot.color,
              fillOpacity: selectedLot === lot.id ? 0.4 : 0.25,
            }}
            eventHandlers={{
              click: () => handleLotClick(lot.id),
            }}
          >
            {selectedLot === lot.id && (
              <Popup>
                <div className="text-sm">
                  <p><strong>{lot.id}</strong></p>
                  <p>Select “Reserve Spot” in the right panel.</p>
                </div>
              </Popup>
            )}
          </Polygon>
        ))}
      </MapContainer>
    </div>
  );
}
