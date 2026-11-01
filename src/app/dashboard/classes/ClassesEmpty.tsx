import Link from "next/link";
import {
  ArrowRight,
  Flower2,
  Leaf,
  PersonStanding,
  CalendarDays,
  HeartHandshake,
  Link2,
} from "lucide-react";
import styles from "./ClassesEmpty.module.css";

export function ClassesEmpty() {
  return (
    <section className={styles["empty"]} aria-labelledby="first-class-heading">
      <div className={styles["intro"]}>
        <div className={styles["copy"]}>
          <span className={styles["eyebrow"]}>
            <Flower2 size={16} strokeWidth={1.5} /> A new beginning
          </span>
          <h2 id="first-class-heading">
            Make space for
            <br />
            <em>your first class.</em>
          </h2>
          <p>
            A morning flow, a quiet stretch, a moment to reconnect. Bring your teaching to life and
            give students a place to join you.
          </p>
          <Link href="/dashboard/classes/new" className={styles["cta"]}>
            Create my first class <ArrowRight size={17} />
          </Link>
          <span className={styles["reassurance"]}>
            We’ll guide you step by step. Save a draft anytime.
          </span>
        </div>
        <div className={styles["scene"]} aria-hidden="true">
          <div className={styles["arch"]}>
            <span className={styles["sun"]} />
            <PersonStanding className={styles["yogi"]} strokeWidth={0.8} />
            <span className={styles["mat"]} />
            <Leaf className={styles["leaf"]} strokeWidth={1} />
          </div>
          <div className={styles["preview"]}>
            <span className={styles["previewIcon"]}>
              <Flower2 size={22} strokeWidth={1.3} />
            </span>
            <div>
              <small>Your next chapter</small>
              <strong>Your first class</strong>
              <p>A little space. So much possibility.</p>
            </div>
          </div>
          <span className={styles["caption"]}>Your teaching belongs here.</span>
        </div>
      </div>
      <div className={styles["journey"]}>
        <div className={styles["journeyTitle"]}>
          <h3>From an idea to the mat</h3>
          <p>Here’s how your first class comes together.</p>
        </div>
        <ol>
          {[
            {
              Icon: CalendarDays,
              title: "Shape your class",
              body: "Choose your practice, set a time, and decide how students will join.",
            },
            {
              Icon: Link2,
              title: "Share your space",
              body: "Publish your class and share your public page with your community.",
            },
            {
              Icon: HeartHandshake,
              title: "Welcome your students",
              body: "See bookings arrive and get ready to teach.",
            },
          ].map(({ Icon, title, body }, index) => (
            <li key={title}>
              <span className={styles["stepIcon"]}>
                <Icon size={20} strokeWidth={1.5} />
              </span>
              <div>
                <span className={styles["stepNumber"]}>0{index + 1}</span>
                <h4>{title}</h4>
                <p>{body}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
