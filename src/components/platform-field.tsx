import { PLATFORMS } from "@/lib/constants";

const LABELS: Record<(typeof PLATFORMS)[number], string> = {
  web: "Web",
  ios: "iOS",
  android: "Android",
};

export function PlatformField({ defaultValue = "web" }: { defaultValue?: string }) {
  return (
    <div className="field">
      <label htmlFor="platform">Platform</label>
      <select
        id="platform"
        name="platform"
        className="select"
        defaultValue={defaultValue}
      >
        {PLATFORMS.map((p) => (
          <option key={p} value={p}>
            {LABELS[p]}
          </option>
        ))}
      </select>
    </div>
  );
}
