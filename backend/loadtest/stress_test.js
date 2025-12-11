import http from 'k6/http';
import { sleep } from 'k6';

export const options = { vus: 20, duration: "20s" };

export default function () {
  http.post("http://localhost:5000/api/stress", JSON.stringify({
    rr_intervals_ms: [750, 780, 790]
  }), { headers: { "Content-Type": "application/json" } });
  sleep(1);
}
