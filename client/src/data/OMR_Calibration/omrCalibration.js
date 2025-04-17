export const qrConfig = {
  x: 460,
  y: 269,
  width: 135,
  height: 118,
};

// OMR Configurations for 4 sections
export const omrConfigs = [
  {
    // OMR 1
    x: 35,
    y: 350,
    width: 206,
    height: 302,
    rows: 10,
    columns: 7,
    threshold: 100,
    label: "OMR 1",
    color: "rgba(255,165,0,0.7)",
  },
  {
    // OMR 2 q1
    x: 65,
    y: 739,
    width: 108,
    height: 896,
    rows: 25,
    columns: 4,
    threshold: 100,
    color: "rgba(0,0,255,0.7)",
    label: "OMR 2",
  },
  {
    // OMR 3 q2
    x: 206,
    y: 740,
    width: 108,
    height: 896,
    rows: 25,
    columns: 4,
    threshold: 100,
    color: "rgba(233,255,0.7)",
    label: "OMR 3",
  },
  {
    // OMR 4 q3
    x: 349,
    y: 739,
    width: 108,
    height: 896,
    rows: 25,
    columns: 4,
    threshold: 100,
    color: "rgba(255,165,0,0.7)",
    label: "OMR 4",
  },
  {
    // OMR 5 q4
    x: 492,
    y: 739,
    width: 108,
    height: 896,
    rows: 25,
    columns: 4,
    threshold: 100,
    color: "rgba(215,165,0,0.7)",
    label: "OMR 5",
  },
];
