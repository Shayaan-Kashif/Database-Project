'use client';

import { useState } from 'react';
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

// Parking lot interface
interface ParkingLot {
  id: string;
  coordinates: LatLngExpression[];
  color: string;
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
];

export default function Map() {
  const router = useRouter();
  const [selectedLot, setSelectedLot] = useState<string | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  const handleLotClick = (lotId: string) => {
    setSelectedLot(lotId);
    setIsSheetOpen(true); // open the Sheet when a lot is selected
  };

  return (
    <div className="relative h-screen w-full rounded-lg overflow-hidden">
      {/* Back to Dashboard Button */}
      <div className="absolute top-4 left-4 z-[1000]">
        <Button
          onClick={() => router.push('/dashboard')}
          variant="outline"
          className="bg-background/90 backdrop-blur-sm shadow-md hover:bg-background"
        >
          <IconArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Button>
      </div>
      {/* The side Sheet */}
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent side="right" className="w-[400px]">
          {selectedLot ? (
            <>
              <SheetHeader>
                <SheetTitle>{selectedLot}</SheetTitle>
                <SheetDescription>
                  Viewing details for <strong>{selectedLot}</strong>.
                </SheetDescription>
              </SheetHeader>
              <div className="mt-4 space-y-3">
                <p>Available spots: 12</p>
                <p>Zone: North Campus</p>
                <Button className="w-full">Reserve Spot</Button>
              </div>
            </>
          ) : (
            <p>No lot selected.</p>
          )}
        </SheetContent>
      </Sheet>

      {/* The map */}
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

        {/* Render parking lots */}
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
                  <p>Tap Reserve Spot in the side panel to continue.</p>
                </div>
              </Popup>
            )}
          </Polygon>
        ))}
      </MapContainer>
    </div>
  );
}
