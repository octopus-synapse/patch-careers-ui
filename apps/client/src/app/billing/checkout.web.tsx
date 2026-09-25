import { fetcher } from "@patch-careers/api-client";
import { Text, YStack } from "@patch-careers/ui";
import { editorialFonts, PrimaryAction, useEditorialPalette } from "@patch-careers/ui/editorial";
import { useLocalSearchParams } from "expo-router";
import Head from "expo-router/head";
import { type FormEvent, type ReactElement, useEffect, useRef, useState } from "react";
import { useAuthBootstrap, useAuthState } from "@/providers/auth-provider";
import { useI18n } from "@/providers/i18n-provider";

type Checkout = {
  id: string;
  kind: "card" | "pix";
  status: string;
  amountCents: number;
  listAmountCents: number;
  creditAppliedCents: number;
  currency: string;
  expiresAt: string;
  publicKey: string | null;
  qrCode: string | null;
  qrCodeBase64: string | null;
  ticketUrl: string | null;
};

type CardFormData = {
  token?: string;
  paymentMethodId?: string;
  installments?: number | string;
};
type CardForm = { getCardFormData: () => CardFormData; unmount?: () => void };
type MercadoPagoSdk = new (
  publicKey: string,
  options: { locale: string },
) => {
  cardForm: (options: {
    amount: string;
    iframe: boolean;
    form: {
      id: string;
      cardholderName: { id: string; placeholder: string };
      cardholderEmail: { id: string; placeholder: string };
      cardNumber: { id: string; placeholder: string };
      cardExpirationDate: { id: string; placeholder: string };
      securityCode: { id: string; placeholder: string };
      installments: { id: string; placeholder: string };
      identificationType: { id: string; placeholder: string };
      identificationNumber: { id: string; placeholder: string };
      issuer: { id: string; placeholder: string };
    };
    callbacks: {
      onFormMounted: (error?: unknown) => void;
      onSubmit: (event: FormEvent<HTMLFormElement>) => Promise<void>;
    };
  }) => CardForm;
};

const checkoutFormStyle = { display: "grid", gap: 12 } as const;
const cardRowStyle = { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 } as const;

function mercadoPagoSdk(): MercadoPagoSdk | undefined {
  return (window as unknown as { MercadoPago?: MercadoPagoSdk }).MercadoPago;
}

function loadMercadoPago(): Promise<void> {
  if (mercadoPagoSdk()) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      'script[src="https://sdk.mercadopago.com/js/v2"]',
    );
    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error("sdk_load_failed")), {
        once: true,
      });
      return;
    }
    const script = document.createElement("script");
    script.src = "https://sdk.mercadopago.com/js/v2";
    script.async = true;
    script.referrerPolicy = "strict-origin";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("sdk_load_failed"));
    document.head.appendChild(script);
  });
}

export default function CheckoutScreen(): ReactElement {
  const { checkout: checkoutId } = useLocalSearchParams<{ checkout?: string }>();
  const { t, locale } = useI18n();
  const { hasBootstrapped } = useAuthBootstrap();
  const { currentUser } = useAuthState();
  const palette = useEditorialPalette();
  const inputStyle = {
    width: "100%",
    minHeight: 48,
    border: `1px solid ${palette.hairlineStrong}`,
    borderRadius: 10,
    padding: "0 13px",
    background: palette.surface,
    color: palette.ink,
    fontSize: 16,
    boxSizing: "border-box" as const,
  };
  const [checkout, setCheckout] = useState<Checkout | null>(null);
  const [ready, setReady] = useState(false);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [now, setNow] = useState(Date.now());
  const formRef = useRef<CardForm | null>(null);
  const checkoutKind = checkout?.kind;
  const checkoutStatus = checkout?.status;
  const checkoutAmountCents = checkout?.amountCents;
  const checkoutPublicKey = checkout?.publicKey;

  useEffect(() => {
    if (!checkoutId) {
      setError(t("go.checkoutError"));
      return;
    }
    let mounted = true;
    const refresh = async () => {
      try {
        const response = await fetcher<Checkout>({
          method: "GET",
          url: `/api/v1/billing/checkouts/${encodeURIComponent(checkoutId)}`,
        });
        if (!mounted) return;
        setCheckout(response.data);
      } catch {
        if (mounted) setError(t("go.checkoutError"));
      }
    };
    void refresh();
    const poll = window.setInterval(() => {
      setNow(Date.now());
      if (
        checkoutStatus &&
        (checkoutStatus === "pending" || (checkoutKind === "pix" && checkoutStatus === "created"))
      )
        void refresh();
    }, 3_000);
    return () => {
      mounted = false;
      window.clearInterval(poll);
    };
  }, [checkoutId, checkoutKind, checkoutStatus, t]);

  useEffect(() => {
    if (checkoutStatus !== "approved" || !hasBootstrapped) return;
    const destination = currentUser?.hasCompletedOnboarding
      ? "/go?checkout=success"
      : "/onboarding";
    const handle = window.setTimeout(() => window.location.assign(destination), 900);
    return () => window.clearTimeout(handle);
  }, [checkoutStatus, currentUser?.hasCompletedOnboarding, hasBootstrapped]);

  useEffect(() => {
    if (
      checkoutKind !== "card" ||
      checkoutStatus !== "created" ||
      !checkoutPublicKey ||
      checkoutAmountCents === undefined ||
      !checkoutId
    )
      return;
    const publicKey = checkoutPublicKey;
    let mounted = true;
    void loadMercadoPago()
      .then(() => {
        const Constructor = mercadoPagoSdk();
        if (!mounted || !Constructor) return;
        const mercadoPago = new Constructor(publicKey, {
          locale: locale === "pt-BR" ? "pt-BR" : "en-US",
        });
        formRef.current = mercadoPago.cardForm({
          amount: (checkoutAmountCents / 100).toFixed(2),
          iframe: true,
          form: {
            id: "form-checkout",
            cardholderName: {
              id: "form-checkout__cardholderName",
              placeholder: t("go.cardholderName"),
            },
            cardholderEmail: {
              id: "form-checkout__cardholderEmail",
              placeholder: t("go.cardholderEmail"),
            },
            cardNumber: { id: "form-checkout__cardNumber", placeholder: t("go.cardNumber") },
            cardExpirationDate: {
              id: "form-checkout__expirationDate",
              placeholder: t("go.cardExpiration"),
            },
            securityCode: {
              id: "form-checkout__securityCode",
              placeholder: t("go.cardSecurityCode"),
            },
            installments: {
              id: "form-checkout__installments",
              placeholder: t("go.cardInstallments"),
            },
            identificationType: {
              id: "form-checkout__identificationType",
              placeholder: t("go.cardDocumentType"),
            },
            identificationNumber: {
              id: "form-checkout__identificationNumber",
              placeholder: t("go.cardDocumentNumber"),
            },
            issuer: { id: "form-checkout__issuer", placeholder: t("go.cardIssuer") },
          },
          callbacks: {
            onFormMounted: (mountError) => {
              if (!mounted) return;
              if (mountError) setError(t("go.checkoutError"));
              else setReady(true);
            },
            onSubmit: async (event) => {
              event.preventDefault();
              const cardData = formRef.current?.getCardFormData();
              const cardToken = cardData?.token;
              if (!cardToken) return setError(t("go.checkoutError"));
              setSaving(true);
              setError(null);
              try {
                const response = await fetcher<Checkout>({
                  method: "POST",
                  url: `/api/v1/billing/checkouts/${encodeURIComponent(checkoutId)}/card`,
                  data: {
                    cardToken,
                    paymentMethodId: cardData.paymentMethodId,
                    installments: 1,
                  },
                });
                setCheckout(response.data);
              } catch {
                setError(t("go.checkoutError"));
              } finally {
                setSaving(false);
              }
            },
          },
        });
      })
      .catch(() => setError(t("go.checkoutError")));
    return () => {
      mounted = false;
      formRef.current?.unmount?.();
      formRef.current = null;
    };
  }, [checkoutAmountCents, checkoutId, checkoutKind, checkoutPublicKey, checkoutStatus, locale, t]);

  const remainingSeconds = checkout
    ? Math.max(0, Math.ceil((new Date(checkout.expiresAt).getTime() - now) / 1_000))
    : 0;
  const remaining = `${String(Math.floor(remainingSeconds / 60)).padStart(2, "0")}:${String(
    remainingSeconds % 60,
  ).padStart(2, "0")}`;
  const qrSource = checkout?.qrCodeBase64
    ? checkout.qrCodeBase64.startsWith("data:")
      ? checkout.qrCodeBase64
      : `data:image/png;base64,${checkout.qrCodeBase64}`
    : null;

  return (
    <YStack flex={1} minHeight="100vh" backgroundColor={palette.bg} padding={24}>
      <Head>
        <title>{t("go.checkoutTitle")} · Patch Careers</title>
        <meta name="referrer" content="strict-origin" />
        <meta name="robots" content="noindex,nofollow" />
      </Head>
      <YStack width="100%" maxWidth={560} alignSelf="center" gap={18} paddingTop={48}>
        <Text fontFamily={editorialFonts.serif} fontSize={38} color={palette.ink}>
          {t("go.checkoutTitle")}
        </Text>
        <Text fontFamily={editorialFonts.sans} color={palette.body}>
          {t("go.checkoutSecure")}
        </Text>
        {error ? (
          <Text color={palette.danger} role="alert">
            {error}
          </Text>
        ) : null}
        {!checkout ? <Text color={palette.muted}>{t("go.checkoutLoading")}</Text> : null}
        {checkout?.status === "approved" ? (
          <Text color={palette.accent}>{t("go.checkoutApproved")}</Text>
        ) : null}
        {checkout?.creditAppliedCents ? (
          <Text color={palette.accent}>
            {t("go.creditApplied", {
              value: new Intl.NumberFormat(locale, {
                style: "currency",
                currency: checkout.currency,
              }).format(checkout.creditAppliedCents / 100),
            })}
          </Text>
        ) : null}
        {["expired", "canceled", "rejected", "failed"].includes(checkout?.status ?? "") ? (
          <Text color={palette.danger}>{t("go.checkoutExpired")}</Text>
        ) : null}
        {checkout?.kind === "pix" && ["created", "pending"].includes(checkout.status) ? (
          <YStack gap={14} alignItems="center">
            <Text
              fontFamily={editorialFonts.sans}
              fontSize={24}
              fontWeight="700"
              color={palette.ink}
            >
              {new Intl.NumberFormat(locale, {
                style: "currency",
                currency: checkout.currency,
              }).format(checkout.amountCents / 100)}
            </Text>
            {qrSource ? (
              <img src={qrSource} width={260} height={260} alt={t("go.pixQrAlt")} />
            ) : null}
            {checkout.qrCode ? (
              <textarea readOnly value={checkout.qrCode} style={{ ...inputStyle, minHeight: 96 }} />
            ) : null}
            <PrimaryAction
              label={copied ? t("go.pixCopied") : t("go.pixCopy")}
              onPress={() => {
                if (!checkout.qrCode) return;
                void navigator.clipboard.writeText(checkout.qrCode).then(() => setCopied(true));
              }}
            />
            <Text color={palette.muted}>{t("go.pixExpires", { time: remaining })}</Text>
          </YStack>
        ) : null}
        {checkout?.kind === "card" && checkout.status === "created" ? (
          <form id="form-checkout" style={checkoutFormStyle}>
            <input id="form-checkout__cardholderName" autoComplete="cc-name" style={inputStyle} />
            <input
              id="form-checkout__cardholderEmail"
              type="email"
              autoComplete="email"
              style={inputStyle}
            />
            <div id="form-checkout__cardNumber" style={inputStyle} />
            <div style={cardRowStyle}>
              <div id="form-checkout__expirationDate" style={inputStyle} />
              <div id="form-checkout__securityCode" style={inputStyle} />
            </div>
            <select id="form-checkout__issuer" style={inputStyle} aria-label={t("go.cardIssuer")} />
            <select
              id="form-checkout__installments"
              style={{ ...inputStyle, display: "none" }}
              aria-label={t("go.cardInstallments")}
            />
            <select
              id="form-checkout__identificationType"
              style={inputStyle}
              aria-label={t("go.cardDocumentType")}
            />
            <input
              id="form-checkout__identificationNumber"
              inputMode="numeric"
              style={inputStyle}
            />
            <button
              id="form-checkout__submit"
              type="submit"
              disabled={!ready || saving}
              style={{
                ...inputStyle,
                background: palette.primary,
                color: palette.onPrimary,
                fontWeight: 700,
              }}
            >
              {saving ? t("go.checkoutProcessing") : t("go.checkoutCardSubmit")}
            </button>
          </form>
        ) : null}
        {checkout?.status === "pending" && checkout.kind === "card" ? (
          <Text color={palette.muted}>{t("go.checkoutProcessing")}</Text>
        ) : null}
        <PrimaryAction label={t("go.backToPlans")} onPress={() => window.location.assign("/go")} />
      </YStack>
    </YStack>
  );
}
