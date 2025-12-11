import http from 'k6/http';

export const options = { vus: 10, duration: "20s" };

export default function () {
  const reg = http.post("http://localhost:5000/api/register");
  const pid = JSON.parse(reg.body).participant_id;

  const sess = http.post("http://localhost:5000/api/session", JSON.stringify({ participant_id: pid }), {
    headers: { "Content-Type": "application/json" }
  });

  const token = JSON.parse(sess.body).data.token;

  http.post("http://localhost:5000/api/task/start", JSON.stringify({ token: token, task: "nback" }), {
    headers: { "Content-Type": "application/json" }
  });
}
