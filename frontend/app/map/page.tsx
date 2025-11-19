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

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
  DialogFooter,
} from "@/components/ui/dialog";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

import { IconArrowLeft, IconX } from "@tabler/icons-react";

import { useAuthStore } from "@/app/stores/useAuthStore";

import { tryRefresh } from "@/lib/tryRefresh"

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

  { id: 'Founders 4',
    coordinates: [
      [43.9500923, -78.8985136],
      [43.9502584, -78.8976673],
      [43.9496380, -78.8973582],
      [43.9493981, -78.8982373],
    ],
    color: 'orange',
  },

  { id: 'Founders 3',
    coordinates: [
      [43.9483961, -78.8987647],
      [43.9484897, -78.8983637],
      [43.9478795, -78.8981371],
      [43.9478032, -78.8985153],
    ],
    color: 'black',
  },

  { id: 'Founders 1',
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

  const token = useAuthStore((state) => state.token);
  const name = useAuthStore((state) => state.name);
  const role = useAuthStore((state) => state.role);

  console.log("Store token:", token);
  console.log("Store role:", role);
  console.log("Store name:", name);

  useEffect(() => {
    const checkAuth = async () => {
      if (!token) {
        const ok = await tryRefresh();
        if (!ok) {
          router.push("/login");
          return;
        }
      }
    };

    checkAuth();
  }, [token, router]);



    // Delay rendering for smoother loading
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setReady(true);
    }, 250); // 250ms delay

    return () => clearTimeout(timer);
  }, []);

  const [selectedLot, setSelectedLot] = useState<string | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  const [lotDetails, setLotDetails] = useState<LotDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [reviews, setReviews] = useState<Review[] | null>(null);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [reviewsError, setReviewsError] = useState<string | null>(null);

  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [reviewTitle, setReviewTitle] = useState("");
  const [reviewDescription, setReviewDescription] = useState("");
  const [reviewScore, setReviewScore] = useState(5);

  const [userParkingLotId, setUserParkingLotId] = useState<string | null>(null);
  const [userLoading, setUserLoading] = useState(false);
  const [currentUserName, setCurrentUserName] = useState<string | null>(null);

  const handleLotClick = async (lotId: string) => {
    setSelectedLot(lotId);
    setIsSheetOpen(true);

    setUserLoading(true);
    try {
      const res = await fetch("http://localhost:8080/api/user", {
        cache: "no-store",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
      });

      if (res.ok) {
        const data = await res.json();
        setUserParkingLotId(data.parkingLotID || null);
        setCurrentUserName(data.name || null);
      } else {
        setUserParkingLotId(null);
      }
    } catch {
      setUserParkingLotId(null);
    } finally {
      setUserLoading(false);
    }
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

  // Fetch reviews
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

  async function submitReview() {
    if (!lotDetails) return;

    const body = {
      parkingLotID: lotDetails.id,
      title: reviewTitle,
      description: reviewDescription,
      score: reviewScore,
    };

    try {
      const res = await fetch("http://localhost:8080/api/reviews", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const err = await res.json();
        alert("Error: " + err.error);
        return;
      }

      setReviewDialogOpen(false);
      setReviewTitle("");
      setReviewDescription("");
      setReviewScore(5);

      const refreshed = await fetch(
        `http://localhost:8080/api/reviews/${lotDetails.id}`,
        { credentials: "include" }
      );
      setReviews(await refreshed.json());

    } catch (e: any) {
      alert(e.message);
    }
  }

  async function deleteReview(userID: string, parkingLotID: string) {
    try {
      const res = await fetch("http://localhost:8080/api/reviews", {
        method: "DELETE",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          userID,
          parkingLotID,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        alert("Error: " + err.error);
        return;
      }

      const data = await res.json();
      alert(data.status);

      const refreshed = await fetch(
        `http://localhost:8080/api/reviews/${parkingLotID}`,
        { credentials: "include" }
      );
      setReviews(await refreshed.json());

    } catch (err: any) {
      alert(err.message);
    }
  }

  async function handleParkHere() {
    if (!lotDetails) return;

    const isCurrentlyParkedHere = userParkingLotId === lotDetails.id;
    const type = isCurrentlyParkedHere ? "exit" : "entry";

    try {
      const res = await fetch("http://localhost:8080/api/park", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          parkingLotID: lotDetails.id,
          type,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        alert("Error: " + (err.error ?? "Failed to update parking status"));
        return;
      }

      const data = await res.json();
      alert(data.status ?? "Parking status updated");

      if (type === "entry") {
        setUserParkingLotId(lotDetails.id);
      } else {
        setUserParkingLotId(null);
      }
    } catch (err: any) {
      alert(err.message);
    }
  }



  return (
    <div className="relative h-screen w-full rounded-lg overflow-hidden">

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

      <Sheet
        open={isSheetOpen}
        onOpenChange={(open) => {
          setIsSheetOpen(open);
          if (!open) {
            setSelectedLot(null);
            setLotDetails(null);
            setReviews(null);

            // ⭐ NEW: Reset parking state on close
            setUserParkingLotId(null);
            setCurrentUserName(null);
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

              <div className="mt-4 space-y-3">
                {loading && <p>Loading...</p>}
                {error && <p className="text-red-600">{error}</p>}
                {!loading && !error && lotDetails && (
                  <>
                    <p>Total Slots: {lotDetails.slots}</p>
                    <p>Occupied: {occupied}</p>
                    <p>Available: {Math.max(0, lotDetails.slots - occupied)}</p>

                    <Button
                      className="w-full"
                      onClick={() => setReviewDialogOpen(true)}
                    >
                      Write a Review
                    </Button>

                    {userLoading ? (
                      <Button disabled className="w-full mt-2">
                        Loading...
                      </Button>
                    ) : (
                      <Button
                        className="w-full mt-2"
                        variant="outline"
                        onClick={handleParkHere}
                      >
                        {userParkingLotId === lotDetails.id ? "Leave lot" : "Im parked here"}
                      </Button>
                    )}
                  </>
                )}
              </div>

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
                          <p className="text-lg font-bold mt-1">{rev.title}</p>
                          <p className="font-semibold">{rev.username}</p>
                          <p className="font-medium">⭐ {rev.score}/5</p>

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

                          {currentUserName && rev.username === currentUserName && (
                            <div className="flex gap-2 mt-3">
                              <Button
                                variant="default"
                                size="sm"
                                onClick={() => console.log("Edit coming soon")}
                              >
                                Edit
                              </Button>

                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => console.log("Mark parked coming soon")}
                              >
                                I’m Parked?
                              </Button>

                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => deleteReview(rev.userID, rev.lotID)}
                              >
                                Delete
                              </Button>
                            </div>
                          )}

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

      <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
        <DialogContent className="max-w-md">

          <div className="flex justify-between items-center">
            <DialogTitle>Write a Review</DialogTitle>
            <DialogClose>
              <IconX className="w-5 h-5 cursor-pointer" />
            </DialogClose>
          </div>

          <DialogHeader />

          <div className="space-y-3 mt-2">
            <div>
              <label className="text-sm font-medium">Title</label>
              <Input
                value={reviewTitle}
                onChange={(e) => setReviewTitle(e.target.value)}
                placeholder="Great parking!"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Description (optional)</label>
              <Textarea
                value={reviewDescription}
                onChange={(e) => setReviewDescription(e.target.value)}
                placeholder="Your experience..."
              />
            </div>

            <div>
              <label className="text-sm font-medium">Score</label>
              <select
                className="border p-2 rounded w-full"
                value={reviewScore}
                onChange={(e) => setReviewScore(Number(e.target.value))}
              >
                {[1,2,3,4,5].map(n => (
                  <option key={n} value={n}>{n} Stars</option>
                ))}
              </select>
            </div>
          </div>

          <DialogFooter className="mt-4">
            <Button className="w-full" onClick={submitReview}>
              Submit Review
            </Button>
          </DialogFooter>

        </DialogContent>
      </Dialog>

      <MapContainer
        center={[43.948, -78.897]}
        zoom={16}
        scrollWheelZoom={true}
        className="h-full w-full z-0"
      >
        <TileLayer
          attribution='© <a href="https://www.openstreetmap.org/">OpenStreetMap</a>'
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
                  <p>Click “Write a Review” in the right panel.</p>
                </div>
              </Popup>
            )}
          </Polygon>
        ))}
      </MapContainer>
    </div>
  );
}