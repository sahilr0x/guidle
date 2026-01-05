import { planSteps } from "../planner/planSteps";

export function handleSession(ws: any) {
  ws.on("message", (data: Buffer) => {
    const { intent } = JSON.parse(data.toString());
    const steps = planSteps(intent);

    for (const step of steps) {
      ws.send(JSON.stringify(step));
    }

    ws.send(JSON.stringify({ type: "DONE" }));
  });
}
