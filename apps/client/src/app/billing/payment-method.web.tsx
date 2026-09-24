import { fetcher } from "@patch-careers/api-client";
import { Text, YStack } from "@patch-careers/ui";
import { editorialFonts, useEditorialPalette } from "@patch-careers/ui/editorial";
import { useLocalSearchParams } from "expo-router";
import Head from "expo-router/head";
import { type FormEvent, type ReactElement, useEffect, useRef, useState } from "react";
import { useI18n } from "@/providers/i18n-provider";

type SessionDetails = {
  publicKey: string;
  plan: "go" | "max";
  returnUrl: string;
};

type CardFormData = { token?: string };
type CardForm = { getCardFormData: () => CardFormData; unmount?: () => void };
type MercadoPagoConstructor = new (
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

declare global {
  interface Window {
    MercadoPago?: MercadoPagoConstructor;
  }
}

const checkoutFormStyle = { display: "grid", gap: 12 } as const;
const cardRowStyle = { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 } as const;

function loadMercadoPago(): Promise<void> {
  if (window.MercadoPago) return Promise.resolve();
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

export default function PaymentMethodScreen(): ReactElement {
  const { session } = useLocalSearchParams<{ session?: string }>();
  const { t, locale } = useI18n();
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
  const [details, setDetails] = useState<SessionDetails | null>(null);
  const [ready, setReady] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const formRef = useRef<CardForm | null>(null);

  useEffect(() => {
    if (!session) {
      setError(t("go.paymentMethodInvalid"));
      return;
    }
    let mounted = true;
    void fetcher<SessionDetails>({
      method: "GET",
      url: `/api/v1/billing/subscription/payment-method-session/${encodeURIComponent(session)}`,
    })
      .then((response) => {
        if (mounted) setDetails(response.data);
      })
      .catch(() => {
        if (mounted) setError(t("go.paymentMethodInvalid"));
      });
    return () => {
      mounted = false;
    };
  }, [session, t]);

  useEffect(() => {
    if (!details || !session) return;
    let mounted = true;
    void loadMercadoPago()
      .then(() => {
        if (!mounted || !window.MercadoPago) return;
        const mercadoPago = new window.MercadoPago(details.publicKey, {
          locale: locale === "pt-BR" ? "pt-BR" : "en-US",
        });
        formRef.current = mercadoPago.cardForm({
          amount: details.plan === "max" ? "150" : "39.99",
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
              if (mountError) setError(t("go.paymentMethodError"));
              else setReady(true);
            },
            onSubmit: async (event) => {
              event.preventDefault();
              const cardToken = formRef.current?.getCardFormData().token;
              if (!cardToken) {
                setError(t("go.paymentMethodError"));
                return;
              }
              setSaving(true);
              setError(null);
              try {
                const response = await fetcher<{ returnUrl: string }>({
                  method: "POST",
                  url: "/api/v1/billing/subscription/payment-method",
                  data: { sessionToken: session, cardToken },
                });
                window.location.assign(response.data.returnUrl);
              } catch {
                setSaving(false);
                setError(t("go.paymentMethodError"));
              }
            },
          },
        });
      })
      .catch(() => {
        if (mounted) setError(t("go.paymentMethodError"));
      });
    return () => {
      mounted = false;
      formRef.current?.unmount?.();
      formRef.current = null;
    };
  }, [details, locale, session, t]);

  return (
    <YStack flex={1} minHeight="100vh" backgroundColor={palette.bg} padding={24}>
      <Head>
        <title>{t("go.paymentMethodTitle")} · Patch Careers</title>
        <meta name="referrer" content="strict-origin" />
        <meta name="robots" content="noindex,nofollow" />
      </Head>
      <YStack width="100%" maxWidth={560} alignSelf="center" gap={18} paddingTop={48}>
        <Text fontFamily={editorialFonts.serif} fontSize={38} color={palette.ink}>
          {t("go.paymentMethodTitle")}
        </Text>
        <Text fontFamily={editorialFonts.sans} fontSize={16} color={palette.body}>
          {t("go.paymentMethodLead")}
        </Text>
        {error ? (
          <Text fontFamily={editorialFonts.sans} color={palette.danger} role="alert">
            {error}
          </Text>
        ) : null}
        {!details || !ready ? (
          <Text fontFamily={editorialFonts.sans} color={palette.muted}>
            {t("go.paymentMethodLoading")}
          </Text>
        ) : null}
        {details ? (
          <form id="form-checkout" style={checkoutFormStyle}>
            <input
              id="form-checkout__cardholderName"
              type="text"
              autoComplete="cc-name"
              style={inputStyle}
            />
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
              type="text"
              inputMode="numeric"
              aria-label={t("go.cardDocumentNumber")}
              style={inputStyle}
            />
            <button
              id="form-checkout__submit"
              type="submit"
              disabled={!ready || saving}
              style={{
                minHeight: 50,
                border: 0,
                borderRadius: 10,
                background: palette.primary,
                color: palette.onPrimary,
                fontSize: 16,
                fontWeight: 700,
                cursor: saving ? "wait" : "pointer",
              }}
            >
              {saving ? t("go.paymentMethodSaving") : t("go.paymentMethodSubmit")}
            </button>
          </form>
        ) : null}
      </YStack>
    </YStack>
  );
}
