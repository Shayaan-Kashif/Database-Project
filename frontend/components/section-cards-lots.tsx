"use client";

import { Card, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { IconPlus, IconEdit, IconTrash } from "@tabler/icons-react";

export default function SectionCardLots() {
  const actions = [
    {
      title: "Add Lot",
      description: "Create a new parking lot",
      icon: <IconPlus className="w-5 h-5" />,
      color: "text-green-600",
      onClick: () => alert("Add lot clicked"),
    },
    {
      title: "Modify Lot",
      description: "Update existing lot information",
      icon: <IconEdit className="w-5 h-5" />,
      color: "text-blue-600",
      onClick: () => alert("Modify lot clicked"),
    },
    {
      title: "Remove Lot",
      description: "Delete a parking lot",
      icon: <IconTrash className="w-5 h-5" />,
      color: "text-red-600",
      onClick: () => alert("Remove lot clicked"),
    },
  ];

  return (
    <div
      className="
        w-full 
        overflow-x-auto 
        overflow-y-hidden 
        pb-4 
        flex 
        justify-center
      "
    >
      {/* Inner container — centered and scrollable */}
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
  );
}
