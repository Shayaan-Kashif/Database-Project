"use client";

import { useState, useEffect } from "react";

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import {
  Dialog,
  DialogHeader,
  DialogContent,
  DialogFooter,
  DialogTitle,
} from "@/components/ui/dialog";

import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";

import { IconPlus, IconEdit, IconTrash } from "@tabler/icons-react";
import { useAuthStore } from "@/app/stores/useAuthStore";

type ParkingLot = {
  id: string;
  name: string;
  slots: number;
  ocupiedSlots: number;
};

export default function SectionCardLots() {
  const token = () => useAuthStore.getState().token;

  // LOTS DATA
  const [lots, setLots] = useState<ParkingLot[]>([]);

  // load lots once
  useEffect(() => {
    async function load() {
      const res = await fetch("http://localhost:8080/api/parkingLots", {
        credentials: "include",
      });
      const data = await res.json();
      setLots(data);
    }
    load();
  }, []);

  // dialogs
  const [openAdd, setOpenAdd] = useState(false);
  const [openModify, setOpenModify] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);

  // form fields
  const [lotName, setLotName] = useState("");
  const [slots, setSlots] = useState("");

  const [selectedModifyLotId, setSelectedModifyLotId] = useState<string>("");
  const [modifyName, setModifyName] = useState("");
  const [modifySlots, setModifySlots] = useState("");

  const [selectedDeleteLotId, setSelectedDeleteLotId] = useState<string>("");

  // ------------------------------
  // ADD LOT
  // ------------------------------
  async function submitAdd() {
    try {
      const res = await fetch("http://localhost:8080/api/parkingLots", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token()}`,
        },
        body: JSON.stringify({
          name: lotName,
          slots: Number(slots),
        }),
      });

      const data = await res.json();
      if (!res.ok) return alert(data.error);

      alert("Lot Created!");
      window.location.reload();
    } catch {
      alert("Failed to create lot.");
    }
  }

  // ------------------------------
  // MODIFY LOT
  // ------------------------------
  async function submitModify() {
    if (!selectedModifyLotId) return alert("Please select a lot.");

    const body: any = {};
    if (modifyName) body.name = modifyName;
    if (modifySlots) body.slots = Number(modifySlots);

    if (Object.keys(body).length === 0)
      return alert("No updates provided.");

    try {
      const res = await fetch(
        `http://localhost:8080/api/parkingLots/${selectedModifyLotId}`,
        {
          method: "PATCH",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token()}`,
          },
          body: JSON.stringify(body),
        }
      );

      const data = await res.json();
      if (!res.ok) return alert(data.error);

      alert("Lot Updated!");
      window.location.reload();
    } catch {
      alert("Failed to update lot.");
    }
  }

  // ------------------------------
  // DELETE LOT
  // ------------------------------
  async function submitDelete() {
    if (!selectedDeleteLotId) return alert("Please select a lot.");

    try {
      const res = await fetch(
        `http://localhost:8080/api/parkingLots/${selectedDeleteLotId}`,
        {
          method: "DELETE",
          credentials: "include",
          headers: {
            Authorization: `Bearer ${token()}`,
          },
        }
      );

      const data = await res.json();
      if (!res.ok) return alert(data.error);

      alert("Lot Deleted!");
      window.location.reload();
    } catch {
      alert("Failed to delete lot.");
    }
  }

  // ------------------------------
  // Cards
  // ------------------------------
  const actions = [
    {
      title: "Add Lot",
      description: "Create a new parking lot",
      icon: <IconPlus className="w-5 h-5" />,
      color: "text-green-600",
      onClick: () => setOpenAdd(true),
    },
    {
      title: "Modify Lot",
      description: "Update existing lot information",
      icon: <IconEdit className="w-5 h-5" />,
      color: "text-blue-600",
      onClick: () => setOpenModify(true),
    },
    {
      title: "Remove Lot",
      description: "Delete a parking lot",
      icon: <IconTrash className="w-5 h-5" />,
      color: "text-red-600",
      onClick: () => setOpenDelete(true),
    },
  ];

  return (
    <>
      {/* ACTION CARDS */}
      <div className="w-full overflow-x-auto pb-4 flex justify-center">
        <div className="inline-flex gap-8 px-4 justify-center">
          {actions.map((item) => (
            <Card
              key={item.title}
              className="w-64 shrink-0 rounded-xl border shadow-sm"
            >
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span className={item.color}>{item.icon}</span>
                  {item.title}
                </CardTitle>
                <CardDescription>{item.description}</CardDescription>
              </CardHeader>

              <CardFooter>
                <Button
                  className="w-full"
                  variant="outline"
                  onClick={item.onClick}
                >
                  {item.title}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>

      {/* ---------------------- */}
      {/* ADD LOT */}
      {/* ---------------------- */}
      <Dialog open={openAdd} onOpenChange={setOpenAdd}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Parking Lot</DialogTitle>
          </DialogHeader>

          <Input
            placeholder="Lot Name"
            value={lotName}
            onChange={(e) => setLotName(e.target.value)}
          />

          <Input
            placeholder="Number of Slots"
            value={slots}
            onChange={(e) => setSlots(e.target.value)}
            type="number"
          />

          <DialogFooter>
            <Button onClick={submitAdd}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ---------------------- */}
      {/* MODIFY LOT */}
      {/* ---------------------- */}
      <Dialog open={openModify} onOpenChange={setOpenModify}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modify Lot</DialogTitle>
          </DialogHeader>

          <Select onValueChange={(val) => setSelectedModifyLotId(val)}>
            <SelectTrigger>
              <SelectValue placeholder="Select a lot" />
            </SelectTrigger>
            <SelectContent>
              {lots.map((lot) => (
                <SelectItem key={lot.id} value={lot.id}>
                  {lot.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Input
            placeholder="New Name (optional)"
            value={modifyName}
            onChange={(e) => setModifyName(e.target.value)}
          />

          <Input
            placeholder="New Slots (optional)"
            value={modifySlots}
            onChange={(e) => setModifySlots(e.target.value)}
            type="number"
          />

          <DialogFooter>
            <Button onClick={submitModify}>Update</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ---------------------- */}
      {/* DELETE LOT */}
      {/* ---------------------- */}
      <Dialog open={openDelete} onOpenChange={setOpenDelete}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Lot</DialogTitle>
          </DialogHeader>

          <Select onValueChange={(val) => setSelectedDeleteLotId(val)}>
            <SelectTrigger>
              <SelectValue placeholder="Select a lot" />
            </SelectTrigger>
            <SelectContent>
              {lots.map((lot) => (
                <SelectItem key={lot.id} value={lot.id}>
                  {lot.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <DialogFooter>
            <Button
              variant="destructive"
              onClick={submitDelete}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
