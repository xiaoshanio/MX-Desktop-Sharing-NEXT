"use client";

import { useState } from "react";

import { RichText, useT } from "@/i18n";
import { Button, Icon, TextField } from "@/ui";

export type NodeDraft = {
  name: string;
  wsUrl: string;
  apiKey: string;
  apiSecret: string;
};

export const emptyNodeDraft = (name = ""): NodeDraft => ({
  name,
  wsUrl: "",
  apiKey: "",
  apiSecret: "",
});

/**
 * One set of LiveKit credentials, plus the built-in "how do I get these" guide.
 * Shared by room creation and node management so the walkthrough copy exists once.
 */
export function NodeCredentialFields({
  value,
  onChange,
}: {
  value: NodeDraft;
  onChange: (next: NodeDraft) => void;
}) {
  const t = useT();
  const [showGuide, setShowGuide] = useState(false);
  const set = <K extends keyof NodeDraft>(key: K, next: NodeDraft[K]) =>
    onChange({ ...value, [key]: next });

  return (
    <div className="mx-form">
      <div className="mx-inline">
        <span className="mx-text-caption">{t("node.needCreds")}</span>
        <span style={{ flex: 1 }} />
        <Button variant="subtle" size="sm" onClick={() => setShowGuide((state) => !state)}>
          <Icon name="info" size={15} />
          {showGuide ? t("node.guideHide") : t("node.guideShow")}
        </Button>
      </div>

      {showGuide && (
        <div className="mx-guide">
          <h3 className="mx-guide__title">{t("node.guide.title")}</h3>
          <ol className="mx-steps">
            <li>
              {t("node.guide.step1a")}{" "}
              <a href="https://cloud.livekit.io" target="_blank" rel="noreferrer">
                cloud.livekit.io
              </a>{" "}
              {t("node.guide.step1b")}
            </li>
            <li>
              <RichText text={t("node.guide.step2")} />
            </li>
            <li>
              <RichText text={t("node.guide.step3")} />
            </li>
            <li>{t("node.guide.step4")}</li>
          </ol>
          <p className="mx-guide__note">{t("node.guide.note")}</p>
        </div>
      )}

      <TextField
        label={t("node.field.name")}
        required
        placeholder={t("node.field.namePlaceholder")}
        hint={t("node.field.nameHint")}
        value={value.name}
        onChange={(event) => set("name", event.target.value)}
      />

      <TextField
        label={t("node.field.url")}
        required
        mono
        placeholder="wss://your-project.livekit.cloud"
        hint={t("node.field.urlHint")}
        value={value.wsUrl}
        onChange={(event) => set("wsUrl", event.target.value)}
      />

      <div className="mx-field-grid">
        <TextField
          label="API Key"
          required
          mono
          placeholder="APIxxxxxxxx"
          value={value.apiKey}
          onChange={(event) => set("apiKey", event.target.value)}
        />
        <TextField
          label="API Secret"
          required
          type="password"
          autoComplete="new-password"
          hint={t("node.field.secretHint")}
          value={value.apiSecret}
          onChange={(event) => set("apiSecret", event.target.value)}
        />
      </div>
    </div>
  );
}
