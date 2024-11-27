"use client";

import { Typography } from "@/components/typography";

const MyUses = () => {
  return (
    <div className="flex flex-col">
      <Typography variant="h2" className="mb-4">
        Uses
      </Typography>
      <Typography variant="p" className="mb-2 text-muted-foreground">
        My digital workspace.
      </Typography>
      <ul className="pl-5 list-disc space-y-1">
        {MY_USES.map((myUse, idx) => (
          <li key={`myUse-${idx}`}>
            <Typography variant="span" className="text-muted-foreground">
              {myUse}
            </Typography>
          </li>
        ))}
      </ul>
    </div>
  );
};

const MY_USES = [
  `Monitor Lenovo G34W-30 34" UltraWide 1440p 170Hz Curved 2024`,
  "Apple Mac Mini M1 Chip with 8-Core CPU 512GB 2020",
  "Apple Magic Mouse 2",
  "Fantech Mint Edition Agile MP904 Mousepad Gaming",
  "Logitech Pebble Keys2 K380s Keyboard Wireless Bluetooth Multi Device",
  "Logitech Webcam C270 HD",
  "Workdesign Tota Natu TT160 Electric Workbench with Adjustable Lift Up",
  "Deli Office Chair / Mesh Work Chair with Headrest E492X",
  "JETE 09 Bluetooth Earphone Sport Extra Bass IPX4",
];

export default MyUses;
