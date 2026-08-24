--
-- PostgreSQL database dump
--

\restrict 4DhWQSTKBD6L2VxbB94lrJqvb3P2NqdHqjC0gPGnZbqbktHqFsZF0nBD9ZUtdpX

-- Dumped from database version 16.14
-- Dumped by pg_dump version 17.10 (Debian 17.10-0+deb13u1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: geek
--

-- *not* creating schema, since initdb creates it


ALTER SCHEMA public OWNER TO geek;

--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: geek
--

COMMENT ON SCHEMA public IS '';


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: achievements; Type: TABLE; Schema: public; Owner: geek
--

CREATE TABLE public.achievements (
    id integer NOT NULL,
    name text NOT NULL,
    description text NOT NULL,
    icon text NOT NULL,
    "criteriaType" text NOT NULL,
    "criteriaValue" integer NOT NULL,
    "nftTokenId" text,
    "badgeRarity" text DEFAULT 'common'::text NOT NULL,
    "badgeFrame" text DEFAULT 'bronze'::text NOT NULL,
    "badgeXpBonus" integer DEFAULT 5 NOT NULL,
    "badgeTokenReward" double precision DEFAULT 0 NOT NULL,
    tier text DEFAULT 'bronze'::text NOT NULL,
    "tierOrder" integer DEFAULT 1 NOT NULL,
    "trackName" text,
    "isHidden" text DEFAULT 'false'::text NOT NULL,
    "isSecret" boolean DEFAULT false NOT NULL,
    "prerequisiteAchievementId" integer,
    "unlockAnimation" text DEFAULT 'standard'::text NOT NULL,
    "geekReward" double precision DEFAULT 0 NOT NULL,
    "xpReward" integer DEFAULT 0 NOT NULL,
    "stickerPackReward" integer DEFAULT 0 NOT NULL
);


ALTER TABLE public.achievements OWNER TO geek;

--
-- Name: achievements_id_seq; Type: SEQUENCE; Schema: public; Owner: geek
--

CREATE SEQUENCE public.achievements_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.achievements_id_seq OWNER TO geek;

--
-- Name: achievements_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: geek
--

ALTER SEQUENCE public.achievements_id_seq OWNED BY public.achievements.id;


--
-- Name: ai_message_history; Type: TABLE; Schema: public; Owner: geek
--

CREATE TABLE public.ai_message_history (
    id integer NOT NULL,
    "userId" integer NOT NULL,
    "character" text NOT NULL,
    message text NOT NULL,
    context text,
    "userSentiment" text,
    "timestamp" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.ai_message_history OWNER TO geek;

--
-- Name: ai_message_history_id_seq; Type: SEQUENCE; Schema: public; Owner: geek
--

CREATE SEQUENCE public.ai_message_history_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.ai_message_history_id_seq OWNER TO geek;

--
-- Name: ai_message_history_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: geek
--

ALTER SEQUENCE public.ai_message_history_id_seq OWNED BY public.ai_message_history.id;


--
-- Name: ai_recommendations; Type: TABLE; Schema: public; Owner: geek
--

CREATE TABLE public.ai_recommendations (
    id integer NOT NULL,
    "userId" integer NOT NULL,
    "recommendationType" text NOT NULL,
    content text NOT NULL,
    context text,
    "timestamp" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "wasActedUpon" boolean DEFAULT false NOT NULL
);


ALTER TABLE public.ai_recommendations OWNER TO geek;

--
-- Name: ai_recommendations_id_seq; Type: SEQUENCE; Schema: public; Owner: geek
--

CREATE SEQUENCE public.ai_recommendations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.ai_recommendations_id_seq OWNER TO geek;

--
-- Name: ai_recommendations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: geek
--

ALTER SEQUENCE public.ai_recommendations_id_seq OWNED BY public.ai_recommendations.id;


--
-- Name: attempts; Type: TABLE; Schema: public; Owner: geek
--

CREATE TABLE public.attempts (
    id integer NOT NULL,
    "userId" integer NOT NULL,
    "questionId" integer NOT NULL,
    "selectedOption" integer NOT NULL,
    "isCorrect" boolean NOT NULL,
    "timeTaken" double precision DEFAULT 15 NOT NULL,
    "sessionId" text,
    "dateAttempted" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "wasSkipped" boolean DEFAULT false NOT NULL,
    "questionRating" integer,
    "streakBonusApplied" double precision DEFAULT 1 NOT NULL,
    "characterPresent" text,
    "characterMessageShown" text,
    "confidenceLevel" integer,
    "deviceType" text,
    "hourOfDay" integer,
    "dayOfWeek" integer
);


ALTER TABLE public.attempts OWNER TO geek;

--
-- Name: attempts_id_seq; Type: SEQUENCE; Schema: public; Owner: geek
--

CREATE SEQUENCE public.attempts_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.attempts_id_seq OWNER TO geek;

--
-- Name: attempts_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: geek
--

ALTER SEQUENCE public.attempts_id_seq OWNED BY public.attempts.id;


--
-- Name: character_interactions; Type: TABLE; Schema: public; Owner: geek
--

CREATE TABLE public.character_interactions (
    id integer NOT NULL,
    "userId" integer NOT NULL,
    "character" text NOT NULL,
    "interactionType" text NOT NULL,
    message text NOT NULL,
    context text,
    "timestamp" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.character_interactions OWNER TO geek;

--
-- Name: character_interactions_id_seq; Type: SEQUENCE; Schema: public; Owner: geek
--

CREATE SEQUENCE public.character_interactions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.character_interactions_id_seq OWNER TO geek;

--
-- Name: character_interactions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: geek
--

ALTER SEQUENCE public.character_interactions_id_seq OWNED BY public.character_interactions.id;


--
-- Name: creator_earnings; Type: TABLE; Schema: public; Owner: geek
--

CREATE TABLE public.creator_earnings (
    id integer NOT NULL,
    "creatorId" integer NOT NULL,
    "questionId" integer NOT NULL,
    amount double precision DEFAULT 0 NOT NULL,
    "timestamp" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "sessionId" text,
    "playerId" integer
);


ALTER TABLE public.creator_earnings OWNER TO geek;

--
-- Name: creator_earnings_id_seq; Type: SEQUENCE; Schema: public; Owner: geek
--

CREATE SEQUENCE public.creator_earnings_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.creator_earnings_id_seq OWNER TO geek;

--
-- Name: creator_earnings_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: geek
--

ALTER SEQUENCE public.creator_earnings_id_seq OWNED BY public.creator_earnings.id;


--
-- Name: dust_transactions; Type: TABLE; Schema: public; Owner: geek
--

CREATE TABLE public.dust_transactions (
    id integer NOT NULL,
    "userId" integer NOT NULL,
    amount integer NOT NULL,
    reason text NOT NULL,
    "stickerId" integer,
    "timestamp" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.dust_transactions OWNER TO geek;

--
-- Name: dust_transactions_id_seq; Type: SEQUENCE; Schema: public; Owner: geek
--

CREATE SEQUENCE public.dust_transactions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.dust_transactions_id_seq OWNER TO geek;

--
-- Name: dust_transactions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: geek
--

ALTER SEQUENCE public.dust_transactions_id_seq OWNED BY public.dust_transactions.id;


--
-- Name: economy_config; Type: TABLE; Schema: public; Owner: geek
--

CREATE TABLE public.economy_config (
    id integer NOT NULL,
    "pointsPerGeek" integer DEFAULT 100 NOT NULL,
    "minimumPoints" integer DEFAULT 100 NOT NULL,
    "exchangeListingExpiryHours" integer DEFAULT 72 NOT NULL,
    "updatedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.economy_config OWNER TO geek;

--
-- Name: economy_config_id_seq; Type: SEQUENCE; Schema: public; Owner: geek
--

CREATE SEQUENCE public.economy_config_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.economy_config_id_seq OWNER TO geek;

--
-- Name: economy_config_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: geek
--

ALTER SEQUENCE public.economy_config_id_seq OWNED BY public.economy_config.id;


--
-- Name: exchange_listings; Type: TABLE; Schema: public; Owner: geek
--

CREATE TABLE public.exchange_listings (
    id integer NOT NULL,
    "sellerId" integer NOT NULL,
    "sellerUserStickerId" integer NOT NULL,
    "stickerId" integer NOT NULL,
    "askPriceGeek" double precision,
    "requestedStickerIdsJson" text,
    status text DEFAULT 'active'::text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "expiresAt" timestamp(3) without time zone NOT NULL,
    "completedAt" timestamp(3) without time zone,
    "cancelledAt" timestamp(3) without time zone,
    "completedById" integer
);


ALTER TABLE public.exchange_listings OWNER TO geek;

--
-- Name: exchange_listings_id_seq; Type: SEQUENCE; Schema: public; Owner: geek
--

CREATE SEQUENCE public.exchange_listings_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.exchange_listings_id_seq OWNER TO geek;

--
-- Name: exchange_listings_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: geek
--

ALTER SEQUENCE public.exchange_listings_id_seq OWNED BY public.exchange_listings.id;


--
-- Name: exchange_offers; Type: TABLE; Schema: public; Owner: geek
--

CREATE TABLE public.exchange_offers (
    id integer NOT NULL,
    "listingId" integer NOT NULL,
    "offererId" integer NOT NULL,
    "offeredUserStickerIdsJson" text NOT NULL,
    note text,
    status text DEFAULT 'pending'::text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.exchange_offers OWNER TO geek;

--
-- Name: exchange_offers_id_seq; Type: SEQUENCE; Schema: public; Owner: geek
--

CREATE SEQUENCE public.exchange_offers_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.exchange_offers_id_seq OWNER TO geek;

--
-- Name: exchange_offers_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: geek
--

ALTER SEQUENCE public.exchange_offers_id_seq OWNED BY public.exchange_offers.id;


--
-- Name: exchange_transactions; Type: TABLE; Schema: public; Owner: geek
--

CREATE TABLE public.exchange_transactions (
    id integer NOT NULL,
    "listingId" integer NOT NULL,
    "sellerId" integer NOT NULL,
    "buyerId" integer NOT NULL,
    "txType" text NOT NULL,
    "geekAmount" double precision DEFAULT 0 NOT NULL,
    "sellerStickerId" integer NOT NULL,
    "buyerStickerIdsJson" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.exchange_transactions OWNER TO geek;

--
-- Name: exchange_transactions_id_seq; Type: SEQUENCE; Schema: public; Owner: geek
--

CREATE SEQUENCE public.exchange_transactions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.exchange_transactions_id_seq OWNER TO geek;

--
-- Name: exchange_transactions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: geek
--

ALTER SEQUENCE public.exchange_transactions_id_seq OWNED BY public.exchange_transactions.id;


--
-- Name: gauntlet_claims; Type: TABLE; Schema: public; Owner: geek
--

CREATE TABLE public.gauntlet_claims (
    id integer NOT NULL,
    "userId" integer NOT NULL,
    "runId" integer NOT NULL,
    amount double precision NOT NULL,
    status text DEFAULT 'claimed'::text NOT NULL,
    "timestamp" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.gauntlet_claims OWNER TO geek;

--
-- Name: gauntlet_claims_id_seq; Type: SEQUENCE; Schema: public; Owner: geek
--

CREATE SEQUENCE public.gauntlet_claims_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.gauntlet_claims_id_seq OWNER TO geek;

--
-- Name: gauntlet_claims_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: geek
--

ALTER SEQUENCE public.gauntlet_claims_id_seq OWNED BY public.gauntlet_claims.id;


--
-- Name: gauntlet_runs; Type: TABLE; Schema: public; Owner: geek
--

CREATE TABLE public.gauntlet_runs (
    id integer NOT NULL,
    "userId" integer NOT NULL,
    "highestRound" integer DEFAULT 0 NOT NULL,
    "totalCorrect" integer DEFAULT 0 NOT NULL,
    "totalQuestions" integer DEFAULT 0 NOT NULL,
    "totalGeekEarned" double precision DEFAULT 0 NOT NULL,
    "totalXpEarned" integer DEFAULT 0 NOT NULL,
    "selectedTopics" text,
    completed boolean DEFAULT false NOT NULL,
    "activeRound" integer,
    "activeState" text,
    "activeStateUpdatedAt" timestamp(3) without time zone,
    "dateStarted" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "dateCompleted" timestamp(3) without time zone
);


ALTER TABLE public.gauntlet_runs OWNER TO geek;

--
-- Name: gauntlet_runs_id_seq; Type: SEQUENCE; Schema: public; Owner: geek
--

CREATE SEQUENCE public.gauntlet_runs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.gauntlet_runs_id_seq OWNER TO geek;

--
-- Name: gauntlet_runs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: geek
--

ALTER SEQUENCE public.gauntlet_runs_id_seq OWNED BY public.gauntlet_runs.id;


--
-- Name: geek_dust; Type: TABLE; Schema: public; Owner: geek
--

CREATE TABLE public.geek_dust (
    id integer NOT NULL,
    "userId" integer NOT NULL,
    amount integer DEFAULT 0 NOT NULL,
    "totalEarned" integer DEFAULT 0 NOT NULL,
    "totalSpent" integer DEFAULT 0 NOT NULL,
    "updatedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.geek_dust OWNER TO geek;

--
-- Name: geek_dust_id_seq; Type: SEQUENCE; Schema: public; Owner: geek
--

CREATE SEQUENCE public.geek_dust_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.geek_dust_id_seq OWNER TO geek;

--
-- Name: geek_dust_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: geek
--

ALTER SEQUENCE public.geek_dust_id_seq OWNED BY public.geek_dust.id;


--
-- Name: kaspa_payments; Type: TABLE; Schema: public; Owner: geek
--

CREATE TABLE public.kaspa_payments (
    id integer NOT NULL,
    "userId" integer NOT NULL,
    "transactionId" text NOT NULL,
    "kaspaAmount" double precision NOT NULL,
    "geekAmount" double precision NOT NULL,
    rate double precision NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    "walletAddress" text NOT NULL,
    confirmations integer DEFAULT 0 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "confirmedAt" timestamp(3) without time zone,
    "paymentReference" text,
    "expiresAt" timestamp(3) without time zone,
    "sompiAmount" bigint
);


ALTER TABLE public.kaspa_payments OWNER TO geek;

--
-- Name: kaspa_payments_id_seq; Type: SEQUENCE; Schema: public; Owner: geek
--

CREATE SEQUENCE public.kaspa_payments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.kaspa_payments_id_seq OWNER TO geek;

--
-- Name: kaspa_payments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: geek
--

ALTER SEQUENCE public.kaspa_payments_id_seq OWNED BY public.kaspa_payments.id;


--
-- Name: kaspa_prices; Type: TABLE; Schema: public; Owner: geek
--

CREATE TABLE public.kaspa_prices (
    id integer NOT NULL,
    "usdPrice" double precision DEFAULT 0.04 NOT NULL,
    "geekPerKas" double precision DEFAULT 25 NOT NULL,
    "updatedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.kaspa_prices OWNER TO geek;

--
-- Name: kaspa_prices_id_seq; Type: SEQUENCE; Schema: public; Owner: geek
--

CREATE SEQUENCE public.kaspa_prices_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.kaspa_prices_id_seq OWNER TO geek;

--
-- Name: kaspa_prices_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: geek
--

ALTER SEQUENCE public.kaspa_prices_id_seq OWNED BY public.kaspa_prices.id;


--
-- Name: kyc_verifications; Type: TABLE; Schema: public; Owner: geek
--

CREATE TABLE public.kyc_verifications (
    id integer NOT NULL,
    "userId" integer NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    provider text,
    "providerId" text,
    "firstName" text,
    "lastName" text,
    email text,
    phone text,
    "dateOfBirth" timestamp(3) without time zone,
    address text,
    city text,
    state text,
    "postalCode" text,
    country text,
    "idDocumentType" text,
    "idDocumentUrl" text,
    "submittedAt" timestamp(3) without time zone,
    "reviewedAt" timestamp(3) without time zone,
    "reviewedBy" integer,
    "rejectionReason" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.kyc_verifications OWNER TO geek;

--
-- Name: kyc_verifications_id_seq; Type: SEQUENCE; Schema: public; Owner: geek
--

CREATE SEQUENCE public.kyc_verifications_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.kyc_verifications_id_seq OWNER TO geek;

--
-- Name: kyc_verifications_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: geek
--

ALTER SEQUENCE public.kyc_verifications_id_seq OWNED BY public.kyc_verifications.id;


--
-- Name: points_conversion_transactions; Type: TABLE; Schema: public; Owner: geek
--

CREATE TABLE public.points_conversion_transactions (
    id integer NOT NULL,
    "userId" integer NOT NULL,
    "pointsSpent" integer NOT NULL,
    "geekReceived" double precision NOT NULL,
    "ratePointsPerGeek" integer NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.points_conversion_transactions OWNER TO geek;

--
-- Name: points_conversion_transactions_id_seq; Type: SEQUENCE; Schema: public; Owner: geek
--

CREATE SEQUENCE public.points_conversion_transactions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.points_conversion_transactions_id_seq OWNER TO geek;

--
-- Name: points_conversion_transactions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: geek
--

ALTER SEQUENCE public.points_conversion_transactions_id_seq OWNED BY public.points_conversion_transactions.id;


--
-- Name: purchases; Type: TABLE; Schema: public; Owner: geek
--

CREATE TABLE public.purchases (
    id integer NOT NULL,
    "userId" integer NOT NULL,
    "fiatAmount" numeric(20,2) NOT NULL,
    "fiatCurrency" text NOT NULL,
    "kasEquivalent" numeric(20,8) NOT NULL,
    "geekAmount" numeric(20,8) NOT NULL,
    "stripeSessionId" text NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    "lockedRate" numeric(20,8) NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.purchases OWNER TO geek;

--
-- Name: purchases_id_seq; Type: SEQUENCE; Schema: public; Owner: geek
--

CREATE SEQUENCE public.purchases_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.purchases_id_seq OWNER TO geek;

--
-- Name: purchases_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: geek
--

ALTER SEQUENCE public.purchases_id_seq OWNED BY public.purchases.id;


--
-- Name: question_validations; Type: TABLE; Schema: public; Owner: geek
--

CREATE TABLE public.question_validations (
    id integer NOT NULL,
    "questionId" integer NOT NULL,
    "validatorId" integer NOT NULL,
    action text NOT NULL,
    "pointsAwarded" integer DEFAULT 0 NOT NULL,
    "geekAwarded" double precision DEFAULT 0.1 NOT NULL,
    "timestamp" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "reviewTime" double precision DEFAULT 0 NOT NULL,
    "detailedFeedback" text
);


ALTER TABLE public.question_validations OWNER TO geek;

--
-- Name: question_validations_id_seq; Type: SEQUENCE; Schema: public; Owner: geek
--

CREATE SEQUENCE public.question_validations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.question_validations_id_seq OWNER TO geek;

--
-- Name: question_validations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: geek
--

ALTER SEQUENCE public.question_validations_id_seq OWNED BY public.question_validations.id;


--
-- Name: questions; Type: TABLE; Schema: public; Owner: geek
--

CREATE TABLE public.questions (
    id integer NOT NULL,
    question text NOT NULL,
    option1 text NOT NULL,
    option2 text NOT NULL,
    option3 text NOT NULL,
    option4 text NOT NULL,
    "correctOption" integer NOT NULL,
    difficulty text DEFAULT 'easy'::text NOT NULL,
    "topicId" integer NOT NULL,
    "createdBy" integer,
    status text DEFAULT 'pending'::text NOT NULL,
    "approvedBy" integer,
    "validatedBy" integer,
    "dateCreated" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "sourceLink" text,
    subtopic text,
    "funFact" text,
    "approvalsCount" integer DEFAULT 0 NOT NULL,
    "rejectionsCount" integer DEFAULT 0 NOT NULL,
    "totalReviews" integer DEFAULT 0 NOT NULL,
    "dateApproved" timestamp(3) without time zone,
    "totalServes" integer DEFAULT 0 NOT NULL,
    "totalEarned" double precision DEFAULT 0 NOT NULL,
    "averageTimeToAnswer" double precision DEFAULT 0 NOT NULL,
    "skipRate" double precision DEFAULT 0 NOT NULL,
    "playerRating" double precision DEFAULT 0 NOT NULL,
    "aiDifficultyScore" double precision DEFAULT 0 NOT NULL,
    "topicTags" text DEFAULT '[]'::text NOT NULL,
    "yearReleased" integer,
    "dateFirstServed" timestamp(3) without time zone,
    "dateLastServed" timestamp(3) without time zone
);


ALTER TABLE public.questions OWNER TO geek;

--
-- Name: questions_id_seq; Type: SEQUENCE; Schema: public; Owner: geek
--

CREATE SEQUENCE public.questions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.questions_id_seq OWNER TO geek;

--
-- Name: questions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: geek
--

ALTER SEQUENCE public.questions_id_seq OWNED BY public.questions.id;


--
-- Name: quiz_attempts; Type: TABLE; Schema: public; Owner: geek
--

CREATE TABLE public.quiz_attempts (
    id integer NOT NULL,
    "attemptId" text NOT NULL,
    "userId" integer NOT NULL,
    "attemptToken" text NOT NULL,
    round integer NOT NULL,
    "correctCount" integer NOT NULL,
    score integer NOT NULL,
    "rewardAmount" numeric(20,8) NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.quiz_attempts OWNER TO geek;

--
-- Name: quiz_attempts_id_seq; Type: SEQUENCE; Schema: public; Owner: geek
--

CREATE SEQUENCE public.quiz_attempts_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.quiz_attempts_id_seq OWNER TO geek;

--
-- Name: quiz_attempts_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: geek
--

ALTER SEQUENCE public.quiz_attempts_id_seq OWNED BY public.quiz_attempts.id;


--
-- Name: review_queue; Type: TABLE; Schema: public; Owner: geek
--

CREATE TABLE public.review_queue (
    id integer NOT NULL,
    "questionId" integer NOT NULL,
    "dateAdded" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    priority integer DEFAULT 0 NOT NULL,
    "lastShown" timestamp(3) without time zone
);


ALTER TABLE public.review_queue OWNER TO geek;

--
-- Name: review_queue_id_seq; Type: SEQUENCE; Schema: public; Owner: geek
--

CREATE SEQUENCE public.review_queue_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.review_queue_id_seq OWNER TO geek;

--
-- Name: review_queue_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: geek
--

ALTER SEQUENCE public.review_queue_id_seq OWNED BY public.review_queue.id;


--
-- Name: rewards; Type: TABLE; Schema: public; Owner: geek
--

CREATE TABLE public.rewards (
    id integer NOT NULL,
    "userId" integer NOT NULL,
    amount numeric(20,8) NOT NULL,
    "attemptId" text,
    "confirmedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    error text,
    status text DEFAULT 'pending'::text NOT NULL,
    txid text
);


ALTER TABLE public.rewards OWNER TO geek;

--
-- Name: rewards_id_seq; Type: SEQUENCE; Schema: public; Owner: geek
--

CREATE SEQUENCE public.rewards_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.rewards_id_seq OWNER TO geek;

--
-- Name: rewards_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: geek
--

ALTER SEQUENCE public.rewards_id_seq OWNED BY public.rewards.id;


--
-- Name: series_completions; Type: TABLE; Schema: public; Owner: geek
--

CREATE TABLE public.series_completions (
    id integer NOT NULL,
    "userId" integer NOT NULL,
    "seriesId" integer NOT NULL,
    "dateCompleted" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.series_completions OWNER TO geek;

--
-- Name: series_completions_id_seq; Type: SEQUENCE; Schema: public; Owner: geek
--

CREATE SEQUENCE public.series_completions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.series_completions_id_seq OWNER TO geek;

--
-- Name: series_completions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: geek
--

ALTER SEQUENCE public.series_completions_id_seq OWNED BY public.series_completions.id;


--
-- Name: sticker_packs; Type: TABLE; Schema: public; Owner: geek
--

CREATE TABLE public.sticker_packs (
    id integer NOT NULL,
    "userId" integer NOT NULL,
    "packType" text DEFAULT 'standard'::text NOT NULL,
    "seriesId" integer,
    "stickersPerPack" integer DEFAULT 5 NOT NULL,
    "guaranteedRarity" text,
    source text,
    "sourceDetail" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "openedAt" timestamp(3) without time zone,
    "isOpened" boolean DEFAULT false NOT NULL
);


ALTER TABLE public.sticker_packs OWNER TO geek;

--
-- Name: sticker_packs_id_seq; Type: SEQUENCE; Schema: public; Owner: geek
--

CREATE SEQUENCE public.sticker_packs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.sticker_packs_id_seq OWNER TO geek;

--
-- Name: sticker_packs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: geek
--

ALTER SEQUENCE public.sticker_packs_id_seq OWNED BY public.sticker_packs.id;


--
-- Name: sticker_purchase_transactions; Type: TABLE; Schema: public; Owner: geek
--

CREATE TABLE public.sticker_purchase_transactions (
    id integer NOT NULL,
    "buyerId" integer NOT NULL,
    "stickerId" integer NOT NULL,
    "priceGeek" double precision NOT NULL,
    "wasDuplicate" boolean DEFAULT false NOT NULL,
    "dustAwarded" integer DEFAULT 0 NOT NULL,
    source text DEFAULT 'direct_shop'::text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.sticker_purchase_transactions OWNER TO geek;

--
-- Name: sticker_purchase_transactions_id_seq; Type: SEQUENCE; Schema: public; Owner: geek
--

CREATE SEQUENCE public.sticker_purchase_transactions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.sticker_purchase_transactions_id_seq OWNER TO geek;

--
-- Name: sticker_purchase_transactions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: geek
--

ALTER SEQUENCE public.sticker_purchase_transactions_id_seq OWNED BY public.sticker_purchase_transactions.id;


--
-- Name: sticker_series; Type: TABLE; Schema: public; Owner: geek
--

CREATE TABLE public.sticker_series (
    id integer NOT NULL,
    name text NOT NULL,
    description text,
    "totalStickers" integer NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL
);


ALTER TABLE public.sticker_series OWNER TO geek;

--
-- Name: sticker_series_id_seq; Type: SEQUENCE; Schema: public; Owner: geek
--

CREATE SEQUENCE public.sticker_series_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.sticker_series_id_seq OWNER TO geek;

--
-- Name: sticker_series_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: geek
--

ALTER SEQUENCE public.sticker_series_id_seq OWNED BY public.sticker_series.id;


--
-- Name: stickers; Type: TABLE; Schema: public; Owner: geek
--

CREATE TABLE public.stickers (
    id integer NOT NULL,
    "seriesId" integer NOT NULL,
    name text NOT NULL,
    image text NOT NULL,
    rarity text DEFAULT 'common'::text NOT NULL,
    number integer NOT NULL
);


ALTER TABLE public.stickers OWNER TO geek;

--
-- Name: stickers_id_seq; Type: SEQUENCE; Schema: public; Owner: geek
--

CREATE SEQUENCE public.stickers_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.stickers_id_seq OWNER TO geek;

--
-- Name: stickers_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: geek
--

ALTER SEQUENCE public.stickers_id_seq OWNED BY public.stickers.id;


--
-- Name: topics; Type: TABLE; Schema: public; Owner: geek
--

CREATE TABLE public.topics (
    id integer NOT NULL,
    name text NOT NULL,
    description text,
    icon text,
    "isActive" boolean DEFAULT true NOT NULL,
    "dateCreated" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.topics OWNER TO geek;

--
-- Name: topics_id_seq; Type: SEQUENCE; Schema: public; Owner: geek
--

CREATE SEQUENCE public.topics_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.topics_id_seq OWNER TO geek;

--
-- Name: topics_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: geek
--

ALTER SEQUENCE public.topics_id_seq OWNED BY public.topics.id;


--
-- Name: treasury_ledger; Type: TABLE; Schema: public; Owner: geek
--

CREATE TABLE public.treasury_ledger (
    id integer NOT NULL,
    amount numeric(20,8) NOT NULL,
    reason text NOT NULL,
    recipient text,
    "triggeringId" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.treasury_ledger OWNER TO geek;

--
-- Name: treasury_ledger_id_seq; Type: SEQUENCE; Schema: public; Owner: geek
--

CREATE SEQUENCE public.treasury_ledger_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.treasury_ledger_id_seq OWNER TO geek;

--
-- Name: treasury_ledger_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: geek
--

ALTER SEQUENCE public.treasury_ledger_id_seq OWNED BY public.treasury_ledger.id;


--
-- Name: user_achievements; Type: TABLE; Schema: public; Owner: geek
--

CREATE TABLE public.user_achievements (
    id integer NOT NULL,
    "userId" integer NOT NULL,
    "achievementId" integer NOT NULL,
    "dateUnlocked" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "tierReached" text DEFAULT 'bronze'::text NOT NULL,
    "wasHidden" boolean DEFAULT false NOT NULL,
    "notificationShown" boolean DEFAULT false NOT NULL
);


ALTER TABLE public.user_achievements OWNER TO geek;

--
-- Name: user_achievements_id_seq; Type: SEQUENCE; Schema: public; Owner: geek
--

CREATE SEQUENCE public.user_achievements_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.user_achievements_id_seq OWNER TO geek;

--
-- Name: user_achievements_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: geek
--

ALTER SEQUENCE public.user_achievements_id_seq OWNED BY public.user_achievements.id;


--
-- Name: user_notifications; Type: TABLE; Schema: public; Owner: geek
--

CREATE TABLE public.user_notifications (
    id integer NOT NULL,
    "userId" integer NOT NULL,
    title text NOT NULL,
    message text NOT NULL,
    category text DEFAULT 'exchange'::text NOT NULL,
    "isRead" boolean DEFAULT false NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.user_notifications OWNER TO geek;

--
-- Name: user_notifications_id_seq; Type: SEQUENCE; Schema: public; Owner: geek
--

CREATE SEQUENCE public.user_notifications_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.user_notifications_id_seq OWNER TO geek;

--
-- Name: user_notifications_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: geek
--

ALTER SEQUENCE public.user_notifications_id_seq OWNED BY public.user_notifications.id;


--
-- Name: user_stickers; Type: TABLE; Schema: public; Owner: geek
--

CREATE TABLE public.user_stickers (
    id integer NOT NULL,
    "userId" integer NOT NULL,
    "stickerId" integer NOT NULL,
    "isDuplicate" boolean DEFAULT false NOT NULL,
    "dateAcquired" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.user_stickers OWNER TO geek;

--
-- Name: user_stickers_id_seq; Type: SEQUENCE; Schema: public; Owner: geek
--

CREATE SEQUENCE public.user_stickers_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.user_stickers_id_seq OWNER TO geek;

--
-- Name: user_stickers_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: geek
--

ALTER SEQUENCE public.user_stickers_id_seq OWNED BY public.user_stickers.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: geek
--

CREATE TABLE public.users (
    id integer NOT NULL,
    username text NOT NULL,
    email text NOT NULL,
    "passwordHash" text NOT NULL,
    "walletAddress" text,
    points integer DEFAULT 0 NOT NULL,
    "geekBalance" numeric(20,8) DEFAULT 0 NOT NULL,
    xp integer DEFAULT 0 NOT NULL,
    level integer DEFAULT 1 NOT NULL,
    "currentStreak" integer DEFAULT 0 NOT NULL,
    "longestStreak" integer DEFAULT 0 NOT NULL,
    "lastLoginDate" timestamp(3) without time zone,
    "streakMilestoneRewards" text DEFAULT '[]'::text NOT NULL,
    role text DEFAULT 'player'::text NOT NULL,
    "isAdmin" boolean DEFAULT false NOT NULL,
    "dateCreated" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "reputationScore" double precision DEFAULT 100 NOT NULL,
    "totalEarnedGeek" numeric(20,8) DEFAULT 0 NOT NULL,
    "questionsSubmitted" integer DEFAULT 0 NOT NULL,
    "questionsApproved" integer DEFAULT 0 NOT NULL,
    "questionsRejected" integer DEFAULT 0 NOT NULL,
    "reviewsCompleted" integer DEFAULT 0 NOT NULL,
    "reviewAccuracy" double precision DEFAULT 0 NOT NULL,
    "streakBonusMultiplier" double precision DEFAULT 1 NOT NULL,
    "favoriteCharacter" text DEFAULT 'GIGA'::text NOT NULL,
    "characterAffinityGiga" double precision DEFAULT 50 NOT NULL,
    "characterAffinityAce" double precision DEFAULT 50 NOT NULL,
    "lastCharacterInteraction" timestamp(3) without time zone,
    "preferredDifficulty" text DEFAULT 'mixed'::text NOT NULL,
    "averageResponseTime" double precision DEFAULT 15 NOT NULL,
    "categoryAccuracies" text DEFAULT '{}'::text NOT NULL,
    "learningStyle" text DEFAULT 'balanced'::text NOT NULL,
    "wordChallengeWins" integer DEFAULT 0 NOT NULL,
    "wordChallengeLosses" integer DEFAULT 0 NOT NULL,
    "wordChallengeHighScore" integer DEFAULT 0 NOT NULL,
    "wordChallengeTotalScore" integer DEFAULT 0 NOT NULL,
    "wordChallengeBingos" integer DEFAULT 0 NOT NULL,
    "aiInteractionCount" integer DEFAULT 0 NOT NULL,
    "lastAiRecommendation" text,
    "characterInteractionHistory" text DEFAULT '[]'::text NOT NULL,
    "wordChallengeDraws" integer DEFAULT 0 NOT NULL,
    "wordChallengeLongestWord" text,
    "wordChallengeFavoriteLetter" text,
    "encryptedPrivKey" text,
    "kycVerified" boolean DEFAULT false NOT NULL
);


ALTER TABLE public.users OWNER TO geek;

--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: geek
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_id_seq OWNER TO geek;

--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: geek
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: withdrawals; Type: TABLE; Schema: public; Owner: geek
--

CREATE TABLE public.withdrawals (
    id integer NOT NULL,
    "userId" integer NOT NULL,
    "toAddress" text NOT NULL,
    amount numeric(20,8) NOT NULL,
    txid text,
    status text DEFAULT 'pending'::text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.withdrawals OWNER TO geek;

--
-- Name: withdrawals_id_seq; Type: SEQUENCE; Schema: public; Owner: geek
--

CREATE SEQUENCE public.withdrawals_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.withdrawals_id_seq OWNER TO geek;

--
-- Name: withdrawals_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: geek
--

ALTER SEQUENCE public.withdrawals_id_seq OWNED BY public.withdrawals.id;


--
-- Name: word_challenge_chats; Type: TABLE; Schema: public; Owner: geek
--

CREATE TABLE public.word_challenge_chats (
    id integer NOT NULL,
    "challengeId" integer NOT NULL,
    "userId" integer NOT NULL,
    message text NOT NULL,
    "timestamp" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.word_challenge_chats OWNER TO geek;

--
-- Name: word_challenge_chats_id_seq; Type: SEQUENCE; Schema: public; Owner: geek
--

CREATE SEQUENCE public.word_challenge_chats_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.word_challenge_chats_id_seq OWNER TO geek;

--
-- Name: word_challenge_chats_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: geek
--

ALTER SEQUENCE public.word_challenge_chats_id_seq OWNED BY public.word_challenge_chats.id;


--
-- Name: word_challenge_daily_challenges; Type: TABLE; Schema: public; Owner: geek
--

CREATE TABLE public.word_challenge_daily_challenges (
    id integer NOT NULL,
    date date NOT NULL,
    "targetScore" integer NOT NULL,
    "targetWords" integer NOT NULL,
    "bonusGeek" double precision DEFAULT 5.0 NOT NULL,
    "bonusXp" integer DEFAULT 50 NOT NULL,
    description text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.word_challenge_daily_challenges OWNER TO geek;

--
-- Name: word_challenge_daily_challenges_id_seq; Type: SEQUENCE; Schema: public; Owner: geek
--

CREATE SEQUENCE public.word_challenge_daily_challenges_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.word_challenge_daily_challenges_id_seq OWNER TO geek;

--
-- Name: word_challenge_daily_challenges_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: geek
--

ALTER SEQUENCE public.word_challenge_daily_challenges_id_seq OWNED BY public.word_challenge_daily_challenges.id;


--
-- Name: word_challenge_invites; Type: TABLE; Schema: public; Owner: geek
--

CREATE TABLE public.word_challenge_invites (
    id integer NOT NULL,
    "challengeId" integer NOT NULL,
    "inviterId" integer NOT NULL,
    "inviteeId" integer NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "expiresAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.word_challenge_invites OWNER TO geek;

--
-- Name: word_challenge_invites_id_seq; Type: SEQUENCE; Schema: public; Owner: geek
--

CREATE SEQUENCE public.word_challenge_invites_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.word_challenge_invites_id_seq OWNER TO geek;

--
-- Name: word_challenge_invites_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: geek
--

ALTER SEQUENCE public.word_challenge_invites_id_seq OWNED BY public.word_challenge_invites.id;


--
-- Name: word_challenge_moves; Type: TABLE; Schema: public; Owner: geek
--

CREATE TABLE public.word_challenge_moves (
    id integer NOT NULL,
    "challengeId" integer NOT NULL,
    "playerId" integer NOT NULL,
    "wordPlayed" text NOT NULL,
    positions text NOT NULL,
    score integer NOT NULL,
    "tilesUsed" integer NOT NULL,
    "isBingo" boolean DEFAULT false NOT NULL,
    "moveNumber" integer NOT NULL,
    "timestamp" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.word_challenge_moves OWNER TO geek;

--
-- Name: word_challenge_moves_id_seq; Type: SEQUENCE; Schema: public; Owner: geek
--

CREATE SEQUENCE public.word_challenge_moves_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.word_challenge_moves_id_seq OWNER TO geek;

--
-- Name: word_challenge_moves_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: geek
--

ALTER SEQUENCE public.word_challenge_moves_id_seq OWNED BY public.word_challenge_moves.id;


--
-- Name: word_challenge_players; Type: TABLE; Schema: public; Owner: geek
--

CREATE TABLE public.word_challenge_players (
    id integer NOT NULL,
    "challengeId" integer NOT NULL,
    "userId" integer NOT NULL,
    "playerNumber" integer NOT NULL,
    score integer DEFAULT 0 NOT NULL,
    rack text DEFAULT '[]'::text NOT NULL,
    "isReady" boolean DEFAULT false NOT NULL,
    "isTurn" boolean DEFAULT false NOT NULL,
    "turnOrder" integer DEFAULT 0 NOT NULL,
    "joinedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.word_challenge_players OWNER TO geek;

--
-- Name: word_challenge_players_id_seq; Type: SEQUENCE; Schema: public; Owner: geek
--

CREATE SEQUENCE public.word_challenge_players_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.word_challenge_players_id_seq OWNER TO geek;

--
-- Name: word_challenge_players_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: geek
--

ALTER SEQUENCE public.word_challenge_players_id_seq OWNED BY public.word_challenge_players.id;


--
-- Name: word_challenge_user_progress; Type: TABLE; Schema: public; Owner: geek
--

CREATE TABLE public.word_challenge_user_progress (
    id integer NOT NULL,
    "userId" integer NOT NULL,
    "challengeId" integer NOT NULL,
    "challengesPlayed" integer DEFAULT 0 NOT NULL,
    "totalScore" integer DEFAULT 0 NOT NULL,
    "totalWords" integer DEFAULT 0 NOT NULL,
    completed boolean DEFAULT false NOT NULL,
    "rewardClaimed" boolean DEFAULT false NOT NULL,
    "lastUpdated" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.word_challenge_user_progress OWNER TO geek;

--
-- Name: word_challenge_user_progress_id_seq; Type: SEQUENCE; Schema: public; Owner: geek
--

CREATE SEQUENCE public.word_challenge_user_progress_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.word_challenge_user_progress_id_seq OWNER TO geek;

--
-- Name: word_challenge_user_progress_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: geek
--

ALTER SEQUENCE public.word_challenge_user_progress_id_seq OWNED BY public.word_challenge_user_progress.id;


--
-- Name: word_challenges; Type: TABLE; Schema: public; Owner: geek
--

CREATE TABLE public.word_challenges (
    id integer NOT NULL,
    "challengeType" text DEFAULT 'friend'::text NOT NULL,
    status text DEFAULT 'waiting'::text NOT NULL,
    "boardState" text NOT NULL,
    "tileBag" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "startedAt" timestamp(3) without time zone,
    "completedAt" timestamp(3) without time zone,
    "currentTurn" integer,
    "turnExpiry" timestamp(3) without time zone,
    "winnerId" integer,
    "passCount" integer DEFAULT 0 NOT NULL,
    "maxPasses" integer DEFAULT 3 NOT NULL
);


ALTER TABLE public.word_challenges OWNER TO geek;

--
-- Name: word_challenges_id_seq; Type: SEQUENCE; Schema: public; Owner: geek
--

CREATE SEQUENCE public.word_challenges_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.word_challenges_id_seq OWNER TO geek;

--
-- Name: word_challenges_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: geek
--

ALTER SEQUENCE public.word_challenges_id_seq OWNED BY public.word_challenges.id;


--
-- Name: achievements id; Type: DEFAULT; Schema: public; Owner: geek
--

ALTER TABLE ONLY public.achievements ALTER COLUMN id SET DEFAULT nextval('public.achievements_id_seq'::regclass);


--
-- Name: ai_message_history id; Type: DEFAULT; Schema: public; Owner: geek
--

ALTER TABLE ONLY public.ai_message_history ALTER COLUMN id SET DEFAULT nextval('public.ai_message_history_id_seq'::regclass);


--
-- Name: ai_recommendations id; Type: DEFAULT; Schema: public; Owner: geek
--

ALTER TABLE ONLY public.ai_recommendations ALTER COLUMN id SET DEFAULT nextval('public.ai_recommendations_id_seq'::regclass);


--
-- Name: attempts id; Type: DEFAULT; Schema: public; Owner: geek
--

ALTER TABLE ONLY public.attempts ALTER COLUMN id SET DEFAULT nextval('public.attempts_id_seq'::regclass);


--
-- Name: character_interactions id; Type: DEFAULT; Schema: public; Owner: geek
--

ALTER TABLE ONLY public.character_interactions ALTER COLUMN id SET DEFAULT nextval('public.character_interactions_id_seq'::regclass);


--
-- Name: creator_earnings id; Type: DEFAULT; Schema: public; Owner: geek
--

ALTER TABLE ONLY public.creator_earnings ALTER COLUMN id SET DEFAULT nextval('public.creator_earnings_id_seq'::regclass);


--
-- Name: dust_transactions id; Type: DEFAULT; Schema: public; Owner: geek
--

ALTER TABLE ONLY public.dust_transactions ALTER COLUMN id SET DEFAULT nextval('public.dust_transactions_id_seq'::regclass);


--
-- Name: economy_config id; Type: DEFAULT; Schema: public; Owner: geek
--

ALTER TABLE ONLY public.economy_config ALTER COLUMN id SET DEFAULT nextval('public.economy_config_id_seq'::regclass);


--
-- Name: exchange_listings id; Type: DEFAULT; Schema: public; Owner: geek
--

ALTER TABLE ONLY public.exchange_listings ALTER COLUMN id SET DEFAULT nextval('public.exchange_listings_id_seq'::regclass);


--
-- Name: exchange_offers id; Type: DEFAULT; Schema: public; Owner: geek
--

ALTER TABLE ONLY public.exchange_offers ALTER COLUMN id SET DEFAULT nextval('public.exchange_offers_id_seq'::regclass);


--
-- Name: exchange_transactions id; Type: DEFAULT; Schema: public; Owner: geek
--

ALTER TABLE ONLY public.exchange_transactions ALTER COLUMN id SET DEFAULT nextval('public.exchange_transactions_id_seq'::regclass);


--
-- Name: gauntlet_claims id; Type: DEFAULT; Schema: public; Owner: geek
--

ALTER TABLE ONLY public.gauntlet_claims ALTER COLUMN id SET DEFAULT nextval('public.gauntlet_claims_id_seq'::regclass);


--
-- Name: gauntlet_runs id; Type: DEFAULT; Schema: public; Owner: geek
--

ALTER TABLE ONLY public.gauntlet_runs ALTER COLUMN id SET DEFAULT nextval('public.gauntlet_runs_id_seq'::regclass);


--
-- Name: geek_dust id; Type: DEFAULT; Schema: public; Owner: geek
--

ALTER TABLE ONLY public.geek_dust ALTER COLUMN id SET DEFAULT nextval('public.geek_dust_id_seq'::regclass);


--
-- Name: kaspa_payments id; Type: DEFAULT; Schema: public; Owner: geek
--

ALTER TABLE ONLY public.kaspa_payments ALTER COLUMN id SET DEFAULT nextval('public.kaspa_payments_id_seq'::regclass);


--
-- Name: kaspa_prices id; Type: DEFAULT; Schema: public; Owner: geek
--

ALTER TABLE ONLY public.kaspa_prices ALTER COLUMN id SET DEFAULT nextval('public.kaspa_prices_id_seq'::regclass);


--
-- Name: kyc_verifications id; Type: DEFAULT; Schema: public; Owner: geek
--

ALTER TABLE ONLY public.kyc_verifications ALTER COLUMN id SET DEFAULT nextval('public.kyc_verifications_id_seq'::regclass);


--
-- Name: points_conversion_transactions id; Type: DEFAULT; Schema: public; Owner: geek
--

ALTER TABLE ONLY public.points_conversion_transactions ALTER COLUMN id SET DEFAULT nextval('public.points_conversion_transactions_id_seq'::regclass);


--
-- Name: purchases id; Type: DEFAULT; Schema: public; Owner: geek
--

ALTER TABLE ONLY public.purchases ALTER COLUMN id SET DEFAULT nextval('public.purchases_id_seq'::regclass);


--
-- Name: question_validations id; Type: DEFAULT; Schema: public; Owner: geek
--

ALTER TABLE ONLY public.question_validations ALTER COLUMN id SET DEFAULT nextval('public.question_validations_id_seq'::regclass);


--
-- Name: questions id; Type: DEFAULT; Schema: public; Owner: geek
--

ALTER TABLE ONLY public.questions ALTER COLUMN id SET DEFAULT nextval('public.questions_id_seq'::regclass);


--
-- Name: quiz_attempts id; Type: DEFAULT; Schema: public; Owner: geek
--

ALTER TABLE ONLY public.quiz_attempts ALTER COLUMN id SET DEFAULT nextval('public.quiz_attempts_id_seq'::regclass);


--
-- Name: review_queue id; Type: DEFAULT; Schema: public; Owner: geek
--

ALTER TABLE ONLY public.review_queue ALTER COLUMN id SET DEFAULT nextval('public.review_queue_id_seq'::regclass);


--
-- Name: rewards id; Type: DEFAULT; Schema: public; Owner: geek
--

ALTER TABLE ONLY public.rewards ALTER COLUMN id SET DEFAULT nextval('public.rewards_id_seq'::regclass);


--
-- Name: series_completions id; Type: DEFAULT; Schema: public; Owner: geek
--

ALTER TABLE ONLY public.series_completions ALTER COLUMN id SET DEFAULT nextval('public.series_completions_id_seq'::regclass);


--
-- Name: sticker_packs id; Type: DEFAULT; Schema: public; Owner: geek
--

ALTER TABLE ONLY public.sticker_packs ALTER COLUMN id SET DEFAULT nextval('public.sticker_packs_id_seq'::regclass);


--
-- Name: sticker_purchase_transactions id; Type: DEFAULT; Schema: public; Owner: geek
--

ALTER TABLE ONLY public.sticker_purchase_transactions ALTER COLUMN id SET DEFAULT nextval('public.sticker_purchase_transactions_id_seq'::regclass);


--
-- Name: sticker_series id; Type: DEFAULT; Schema: public; Owner: geek
--

ALTER TABLE ONLY public.sticker_series ALTER COLUMN id SET DEFAULT nextval('public.sticker_series_id_seq'::regclass);


--
-- Name: stickers id; Type: DEFAULT; Schema: public; Owner: geek
--

ALTER TABLE ONLY public.stickers ALTER COLUMN id SET DEFAULT nextval('public.stickers_id_seq'::regclass);


--
-- Name: topics id; Type: DEFAULT; Schema: public; Owner: geek
--

ALTER TABLE ONLY public.topics ALTER COLUMN id SET DEFAULT nextval('public.topics_id_seq'::regclass);


--
-- Name: treasury_ledger id; Type: DEFAULT; Schema: public; Owner: geek
--

ALTER TABLE ONLY public.treasury_ledger ALTER COLUMN id SET DEFAULT nextval('public.treasury_ledger_id_seq'::regclass);


--
-- Name: user_achievements id; Type: DEFAULT; Schema: public; Owner: geek
--

ALTER TABLE ONLY public.user_achievements ALTER COLUMN id SET DEFAULT nextval('public.user_achievements_id_seq'::regclass);


--
-- Name: user_notifications id; Type: DEFAULT; Schema: public; Owner: geek
--

ALTER TABLE ONLY public.user_notifications ALTER COLUMN id SET DEFAULT nextval('public.user_notifications_id_seq'::regclass);


--
-- Name: user_stickers id; Type: DEFAULT; Schema: public; Owner: geek
--

ALTER TABLE ONLY public.user_stickers ALTER COLUMN id SET DEFAULT nextval('public.user_stickers_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: geek
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Name: withdrawals id; Type: DEFAULT; Schema: public; Owner: geek
--

ALTER TABLE ONLY public.withdrawals ALTER COLUMN id SET DEFAULT nextval('public.withdrawals_id_seq'::regclass);


--
-- Name: word_challenge_chats id; Type: DEFAULT; Schema: public; Owner: geek
--

ALTER TABLE ONLY public.word_challenge_chats ALTER COLUMN id SET DEFAULT nextval('public.word_challenge_chats_id_seq'::regclass);


--
-- Name: word_challenge_daily_challenges id; Type: DEFAULT; Schema: public; Owner: geek
--

ALTER TABLE ONLY public.word_challenge_daily_challenges ALTER COLUMN id SET DEFAULT nextval('public.word_challenge_daily_challenges_id_seq'::regclass);


--
-- Name: word_challenge_invites id; Type: DEFAULT; Schema: public; Owner: geek
--

ALTER TABLE ONLY public.word_challenge_invites ALTER COLUMN id SET DEFAULT nextval('public.word_challenge_invites_id_seq'::regclass);


--
-- Name: word_challenge_moves id; Type: DEFAULT; Schema: public; Owner: geek
--

ALTER TABLE ONLY public.word_challenge_moves ALTER COLUMN id SET DEFAULT nextval('public.word_challenge_moves_id_seq'::regclass);


--
-- Name: word_challenge_players id; Type: DEFAULT; Schema: public; Owner: geek
--

ALTER TABLE ONLY public.word_challenge_players ALTER COLUMN id SET DEFAULT nextval('public.word_challenge_players_id_seq'::regclass);


--
-- Name: word_challenge_user_progress id; Type: DEFAULT; Schema: public; Owner: geek
--

ALTER TABLE ONLY public.word_challenge_user_progress ALTER COLUMN id SET DEFAULT nextval('public.word_challenge_user_progress_id_seq'::regclass);


--
-- Name: word_challenges id; Type: DEFAULT; Schema: public; Owner: geek
--

ALTER TABLE ONLY public.word_challenges ALTER COLUMN id SET DEFAULT nextval('public.word_challenges_id_seq'::regclass);


--
-- Data for Name: achievements; Type: TABLE DATA; Schema: public; Owner: geek
--

COPY public.achievements (id, name, description, icon, "criteriaType", "criteriaValue", "nftTokenId", "badgeRarity", "badgeFrame", "badgeXpBonus", "badgeTokenReward", tier, "tierOrder", "trackName", "isHidden", "isSecret", "prerequisiteAchievementId", "unlockAnimation", "geekReward", "xpReward", "stickerPackReward") FROM stdin;
\.


--
-- Data for Name: ai_message_history; Type: TABLE DATA; Schema: public; Owner: geek
--

COPY public.ai_message_history (id, "userId", "character", message, context, "userSentiment", "timestamp") FROM stdin;
\.


--
-- Data for Name: ai_recommendations; Type: TABLE DATA; Schema: public; Owner: geek
--

COPY public.ai_recommendations (id, "userId", "recommendationType", content, context, "timestamp", "wasActedUpon") FROM stdin;
\.


--
-- Data for Name: attempts; Type: TABLE DATA; Schema: public; Owner: geek
--

COPY public.attempts (id, "userId", "questionId", "selectedOption", "isCorrect", "timeTaken", "sessionId", "dateAttempted", "wasSkipped", "questionRating", "streakBonusApplied", "characterPresent", "characterMessageShown", "confidenceLevel", "deviceType", "hourOfDay", "dayOfWeek") FROM stdin;
1	2	189	2	f	1.963	daily_2_2026-06-26	2026-06-26 11:33:29.252	f	\N	1	\N	\N	\N	\N	\N	\N
2	2	175	3	f	0.88	daily_2_2026-06-26	2026-06-26 11:33:29.28	f	\N	1	\N	\N	\N	\N	\N	\N
3	2	168	2	t	1.277	daily_2_2026-06-26	2026-06-26 11:33:29.313	f	\N	1	\N	\N	\N	\N	\N	\N
4	2	167	1	f	1.409	daily_2_2026-06-26	2026-06-26 11:33:29.333	f	\N	1	\N	\N	\N	\N	\N	\N
5	2	156	2	f	0.999	daily_2_2026-06-26	2026-06-26 11:33:29.364	f	\N	1	\N	\N	\N	\N	\N	\N
6	2	190	3	t	0.825	daily_2_2026-06-26	2026-06-26 11:33:29.384	f	\N	1	\N	\N	\N	\N	\N	\N
7	2	164	3	f	0.947	daily_2_2026-06-26	2026-06-26 11:33:29.415	f	\N	1	\N	\N	\N	\N	\N	\N
8	2	155	3	f	0.979	daily_2_2026-06-26	2026-06-26 11:33:29.434	f	\N	1	\N	\N	\N	\N	\N	\N
9	2	192	2	f	1.073	daily_2_2026-06-26	2026-06-26 11:33:29.465	f	\N	1	\N	\N	\N	\N	\N	\N
10	2	181	3	t	1.18	daily_2_2026-06-26	2026-06-26 11:33:29.484	f	\N	1	\N	\N	\N	\N	\N	\N
11	2	181	2	f	1.357	daily_2_2026-06-26	2026-06-26 11:55:37.812	f	\N	1	\N	\N	\N	\N	\N	\N
12	2	179	3	f	0.767	daily_2_2026-06-26	2026-06-26 11:55:37.828	f	\N	1	\N	\N	\N	\N	\N	\N
13	2	164	3	f	0.925	daily_2_2026-06-26	2026-06-26 11:55:37.833	f	\N	1	\N	\N	\N	\N	\N	\N
14	2	149	3	f	0.914	daily_2_2026-06-26	2026-06-26 11:55:37.837	f	\N	1	\N	\N	\N	\N	\N	\N
15	2	178	2	f	0.973	daily_2_2026-06-26	2026-06-26 11:55:37.843	f	\N	1	\N	\N	\N	\N	\N	\N
16	2	184	1	f	1.07	daily_2_2026-06-26	2026-06-26 11:55:37.847	f	\N	1	\N	\N	\N	\N	\N	\N
17	2	176	3	t	0.812	daily_2_2026-06-26	2026-06-26 11:55:37.852	f	\N	1	\N	\N	\N	\N	\N	\N
18	2	165	3	f	0.904	daily_2_2026-06-26	2026-06-26 11:55:37.856	f	\N	1	\N	\N	\N	\N	\N	\N
19	2	166	3	f	0.692	daily_2_2026-06-26	2026-06-26 11:55:37.86	f	\N	1	\N	\N	\N	\N	\N	\N
20	2	189	2	f	7.963	daily_2_2026-06-26	2026-06-26 11:55:37.864	f	\N	1	\N	\N	\N	\N	\N	\N
21	2	151	2	t	1.912	gauntlet_1_r1	2026-06-26 13:13:43.832	f	\N	1	\N	\N	\N	\N	\N	\N
22	2	145	3	f	0.747	gauntlet_1_r1	2026-06-26 13:13:43.84	f	\N	1	\N	\N	\N	\N	\N	\N
23	2	157	4	f	0.67	gauntlet_1_r1	2026-06-26 13:13:43.844	f	\N	1	\N	\N	\N	\N	\N	\N
24	2	150	3	f	0.763	gauntlet_1_r1	2026-06-26 13:13:43.848	f	\N	1	\N	\N	\N	\N	\N	\N
25	2	158	3	f	0.646	gauntlet_1_r1	2026-06-26 13:13:43.852	f	\N	1	\N	\N	\N	\N	\N	\N
26	2	152	2	t	0.782	gauntlet_1_r1	2026-06-26 13:13:43.856	f	\N	1	\N	\N	\N	\N	\N	\N
27	2	154	2	t	1.149	gauntlet_1_r1	2026-06-26 13:13:43.859	f	\N	1	\N	\N	\N	\N	\N	\N
28	2	160	3	f	1.129	gauntlet_1_r1	2026-06-26 13:13:43.863	f	\N	1	\N	\N	\N	\N	\N	\N
29	2	162	3	f	0.881	gauntlet_1_r1	2026-06-26 13:13:43.867	f	\N	1	\N	\N	\N	\N	\N	\N
30	2	148	1	f	1.094	gauntlet_1_r1	2026-06-26 13:13:43.871	f	\N	1	\N	\N	\N	\N	\N	\N
31	3	151	2	f	1.451	daily_3_2026-06-30	2026-06-30 10:32:48.434	f	\N	1	\N	\N	\N	\N	\N	\N
32	3	166	3	f	0.778	daily_3_2026-06-30	2026-06-30 10:32:48.445	f	\N	1	\N	\N	\N	\N	\N	\N
33	3	153	3	f	1.423	daily_3_2026-06-30	2026-06-30 10:32:48.449	f	\N	1	\N	\N	\N	\N	\N	\N
34	3	187	3	t	0.835	daily_3_2026-06-30	2026-06-30 10:32:48.454	f	\N	1	\N	\N	\N	\N	\N	\N
35	3	188	2	f	1.165	daily_3_2026-06-30	2026-06-30 10:32:48.458	f	\N	1	\N	\N	\N	\N	\N	\N
36	3	183	3	t	1.146	daily_3_2026-06-30	2026-06-30 10:32:48.462	f	\N	1	\N	\N	\N	\N	\N	\N
37	3	178	2	f	1.119	daily_3_2026-06-30	2026-06-30 10:32:48.465	f	\N	1	\N	\N	\N	\N	\N	\N
38	3	179	1	t	0.841	daily_3_2026-06-30	2026-06-30 10:32:48.468	f	\N	1	\N	\N	\N	\N	\N	\N
39	3	147	2	f	0.992	daily_3_2026-06-30	2026-06-30 10:32:48.472	f	\N	1	\N	\N	\N	\N	\N	\N
40	3	156	2	f	1.028	daily_3_2026-06-30	2026-06-30 10:32:48.476	f	\N	1	\N	\N	\N	\N	\N	\N
41	2	154	3	f	1.453	daily_2_2026-07-10	2026-07-10 10:08:45.43	f	\N	1	\N	\N	\N	\N	\N	\N
42	2	160	2	f	0.588	daily_2_2026-07-10	2026-07-10 10:08:45.446	f	\N	1	\N	\N	\N	\N	\N	\N
43	2	145	2	t	0.488	daily_2_2026-07-10	2026-07-10 10:08:45.45	f	\N	1	\N	\N	\N	\N	\N	\N
44	2	175	3	f	0.425	daily_2_2026-07-10	2026-07-10 10:08:45.454	f	\N	1	\N	\N	\N	\N	\N	\N
45	2	158	3	f	0.396	daily_2_2026-07-10	2026-07-10 10:08:45.459	f	\N	1	\N	\N	\N	\N	\N	\N
46	2	146	3	f	0.42	daily_2_2026-07-10	2026-07-10 10:08:45.463	f	\N	1	\N	\N	\N	\N	\N	\N
47	2	176	3	t	0.459	daily_2_2026-07-10	2026-07-10 10:08:45.466	f	\N	1	\N	\N	\N	\N	\N	\N
48	2	150	2	t	0.515	daily_2_2026-07-10	2026-07-10 10:08:45.47	f	\N	1	\N	\N	\N	\N	\N	\N
49	2	174	2	t	0.76	daily_2_2026-07-10	2026-07-10 10:08:45.474	f	\N	1	\N	\N	\N	\N	\N	\N
50	2	170	3	f	1.039	daily_2_2026-07-10	2026-07-10 10:08:45.477	f	\N	1	\N	\N	\N	\N	\N	\N
51	2	162	3	t	0.778	daily_2_2026-07-10	2026-07-10 10:09:04.704	f	\N	1	\N	\N	\N	\N	\N	\N
52	2	170	3	f	0.445	daily_2_2026-07-10	2026-07-10 10:09:04.712	f	\N	1	\N	\N	\N	\N	\N	\N
53	2	165	2	t	0.467	daily_2_2026-07-10	2026-07-10 10:09:04.715	f	\N	1	\N	\N	\N	\N	\N	\N
54	2	168	3	f	0.508	daily_2_2026-07-10	2026-07-10 10:09:04.718	f	\N	1	\N	\N	\N	\N	\N	\N
55	2	159	3	f	0.469	daily_2_2026-07-10	2026-07-10 10:09:04.721	f	\N	1	\N	\N	\N	\N	\N	\N
56	2	160	3	t	0.605	daily_2_2026-07-10	2026-07-10 10:09:04.725	f	\N	1	\N	\N	\N	\N	\N	\N
57	2	191	2	f	0.443	daily_2_2026-07-10	2026-07-10 10:09:04.729	f	\N	1	\N	\N	\N	\N	\N	\N
58	2	145	3	f	0.391	daily_2_2026-07-10	2026-07-10 10:09:04.731	f	\N	1	\N	\N	\N	\N	\N	\N
59	2	149	3	f	0.373	daily_2_2026-07-10	2026-07-10 10:09:04.734	f	\N	1	\N	\N	\N	\N	\N	\N
60	2	155	3	f	0.553	daily_2_2026-07-10	2026-07-10 10:09:04.737	f	\N	1	\N	\N	\N	\N	\N	\N
61	2	150	1	f	1.645	gauntlet_1_r2	2026-07-16 12:51:17.666	f	\N	1	\N	\N	\N	\N	\N	\N
62	2	162	3	f	0.515	gauntlet_1_r2	2026-07-16 12:51:18.568	f	\N	1	\N	\N	\N	\N	\N	\N
63	2	157	3	f	0.458	gauntlet_1_r2	2026-07-16 12:51:18.601	f	\N	1	\N	\N	\N	\N	\N	\N
64	2	149	3	f	0.539	gauntlet_1_r2	2026-07-16 12:51:18.692	f	\N	1	\N	\N	\N	\N	\N	\N
65	2	152	2	f	0.631	gauntlet_1_r2	2026-07-16 12:51:18.818	f	\N	1	\N	\N	\N	\N	\N	\N
66	2	145	2	t	0.717	gauntlet_1_r2	2026-07-16 12:51:18.942	f	\N	1	\N	\N	\N	\N	\N	\N
67	2	147	1	f	9.676	gauntlet_1_r2	2026-07-16 12:51:19.007	f	\N	1	\N	\N	\N	\N	\N	\N
68	2	158	2	f	2.653	gauntlet_1_r2	2026-07-16 12:51:19.066	f	\N	1	\N	\N	\N	\N	\N	\N
69	2	161	2	f	1.247	gauntlet_1_r2	2026-07-16 12:51:19.409	f	\N	1	\N	\N	\N	\N	\N	\N
70	2	156	1	t	2.732	gauntlet_1_r2	2026-07-16 12:51:19.467	f	\N	1	\N	\N	\N	\N	\N	\N
71	2	158	2	f	2.109	gauntlet_1_r3	2026-07-16 12:52:04.224	f	\N	1	\N	\N	\N	\N	\N	\N
72	2	157	4	f	0.659	gauntlet_1_r3	2026-07-16 12:52:04.228	f	\N	1	\N	\N	\N	\N	\N	\N
73	2	146	3	t	0.759	gauntlet_1_r3	2026-07-16 12:52:04.233	f	\N	1	\N	\N	\N	\N	\N	\N
74	2	150	1	f	0.619	gauntlet_1_r3	2026-07-16 12:52:04.236	f	\N	1	\N	\N	\N	\N	\N	\N
75	2	147	2	f	1.602	gauntlet_1_r3	2026-07-16 12:52:04.238	f	\N	1	\N	\N	\N	\N	\N	\N
76	2	160	3	f	0.8	gauntlet_1_r3	2026-07-16 12:52:04.24	f	\N	1	\N	\N	\N	\N	\N	\N
77	2	151	3	f	0.593	gauntlet_1_r3	2026-07-16 12:52:04.243	f	\N	1	\N	\N	\N	\N	\N	\N
78	2	148	2	f	0.594	gauntlet_1_r3	2026-07-16 12:52:04.245	f	\N	1	\N	\N	\N	\N	\N	\N
79	2	162	2	f	0.664	gauntlet_1_r3	2026-07-16 12:52:04.248	f	\N	1	\N	\N	\N	\N	\N	\N
80	2	161	3	f	0.682	gauntlet_1_r3	2026-07-16 12:52:04.25	f	\N	1	\N	\N	\N	\N	\N	\N
81	2	156	2	f	1.545	gauntlet_2_r1	2026-07-16 15:09:24.396	f	\N	1	\N	\N	\N	\N	\N	\N
82	2	157	3	t	0.656	gauntlet_2_r1	2026-07-16 15:09:24.412	f	\N	1	\N	\N	\N	\N	\N	\N
83	2	145	3	f	0.66	gauntlet_2_r1	2026-07-16 15:09:24.424	f	\N	1	\N	\N	\N	\N	\N	\N
84	2	150	3	f	0.771	gauntlet_2_r1	2026-07-16 15:09:24.433	f	\N	1	\N	\N	\N	\N	\N	\N
85	2	158	3	f	0.694	gauntlet_2_r1	2026-07-16 15:09:24.442	f	\N	1	\N	\N	\N	\N	\N	\N
86	2	148	2	f	1.454	gauntlet_2_r1	2026-07-16 15:09:24.452	f	\N	1	\N	\N	\N	\N	\N	\N
87	2	154	4	t	1.69	gauntlet_2_r1	2026-07-16 15:09:24.462	f	\N	1	\N	\N	\N	\N	\N	\N
88	2	149	2	f	2.776	gauntlet_2_r1	2026-07-16 15:09:24.471	f	\N	1	\N	\N	\N	\N	\N	\N
89	2	153	1	f	1.178	gauntlet_2_r1	2026-07-16 15:09:24.479	f	\N	1	\N	\N	\N	\N	\N	\N
90	2	159	3	t	0.86	gauntlet_2_r1	2026-07-16 15:09:24.486	f	\N	1	\N	\N	\N	\N	\N	\N
91	2	148	2	f	1.53	gauntlet_3_r1	2026-07-16 15:28:07.921	f	\N	1	\N	\N	\N	\N	\N	\N
92	2	159	3	f	0.476	gauntlet_3_r1	2026-07-16 15:28:07.935	f	\N	1	\N	\N	\N	\N	\N	\N
93	2	153	2	t	0.485	gauntlet_3_r1	2026-07-16 15:28:07.943	f	\N	1	\N	\N	\N	\N	\N	\N
94	2	155	3	f	0.475	gauntlet_3_r1	2026-07-16 15:28:07.95	f	\N	1	\N	\N	\N	\N	\N	\N
95	2	160	2	f	0.531	gauntlet_3_r1	2026-07-16 15:28:07.957	f	\N	1	\N	\N	\N	\N	\N	\N
96	2	145	2	f	0.574	gauntlet_3_r1	2026-07-16 15:28:07.964	f	\N	1	\N	\N	\N	\N	\N	\N
97	2	147	2	t	0.486	gauntlet_3_r1	2026-07-16 15:28:07.972	f	\N	1	\N	\N	\N	\N	\N	\N
98	2	150	2	t	0.524	gauntlet_3_r1	2026-07-16 15:28:07.978	f	\N	1	\N	\N	\N	\N	\N	\N
99	2	146	2	t	0.634	gauntlet_3_r1	2026-07-16 15:28:07.984	f	\N	1	\N	\N	\N	\N	\N	\N
100	2	161	2	f	0.73	gauntlet_3_r1	2026-07-16 15:28:07.991	f	\N	1	\N	\N	\N	\N	\N	\N
101	10	193	2	t	2.06	gauntlet_4_r1	2026-07-16 16:40:41.49	f	\N	1	\N	\N	\N	\N	\N	\N
102	10	162	2	f	1.105	gauntlet_4_r1	2026-07-16 16:40:41.504	f	\N	1	\N	\N	\N	\N	\N	\N
103	10	156	3	t	0.923	gauntlet_4_r1	2026-07-16 16:40:41.512	f	\N	1	\N	\N	\N	\N	\N	\N
104	10	154	2	t	0.924	gauntlet_4_r1	2026-07-16 16:40:41.521	f	\N	1	\N	\N	\N	\N	\N	\N
105	10	149	3	f	0.857	gauntlet_4_r1	2026-07-16 16:40:41.528	f	\N	1	\N	\N	\N	\N	\N	\N
106	10	151	2	t	0.738	gauntlet_4_r1	2026-07-16 16:40:41.536	f	\N	1	\N	\N	\N	\N	\N	\N
107	10	161	2	t	0.723	gauntlet_4_r1	2026-07-16 16:40:41.544	f	\N	1	\N	\N	\N	\N	\N	\N
108	10	194	3	f	0.671	gauntlet_4_r1	2026-07-16 16:40:41.552	f	\N	1	\N	\N	\N	\N	\N	\N
109	10	145	3	f	1.365	gauntlet_4_r1	2026-07-16 16:40:41.559	f	\N	1	\N	\N	\N	\N	\N	\N
110	10	159	2	f	1.172	gauntlet_4_r1	2026-07-16 16:40:41.565	f	\N	1	\N	\N	\N	\N	\N	\N
111	10	150	2	f	1.656	gauntlet_4_r2	2026-07-16 16:54:21.401	f	\N	1	\N	\N	\N	\N	\N	\N
112	10	196	2	f	0.95	gauntlet_4_r2	2026-07-16 16:54:21.438	f	\N	1	\N	\N	\N	\N	\N	\N
113	10	194	3	f	0.864	gauntlet_4_r2	2026-07-16 16:54:21.445	f	\N	1	\N	\N	\N	\N	\N	\N
114	10	145	2	t	0.789	gauntlet_4_r2	2026-07-16 16:54:21.454	f	\N	1	\N	\N	\N	\N	\N	\N
115	10	155	2	f	2.786	gauntlet_4_r2	2026-07-16 16:54:21.463	f	\N	1	\N	\N	\N	\N	\N	\N
116	10	148	2	f	1.347	gauntlet_4_r2	2026-07-16 16:54:21.471	f	\N	1	\N	\N	\N	\N	\N	\N
117	10	160	2	f	1.171	gauntlet_4_r2	2026-07-16 16:54:21.48	f	\N	1	\N	\N	\N	\N	\N	\N
118	10	151	3	f	2.577	gauntlet_4_r2	2026-07-16 16:54:21.488	f	\N	1	\N	\N	\N	\N	\N	\N
119	10	149	2	f	2.559	gauntlet_4_r2	2026-07-16 16:54:21.498	f	\N	1	\N	\N	\N	\N	\N	\N
120	10	162	2	f	0.92	gauntlet_4_r2	2026-07-16 16:54:21.507	f	\N	1	\N	\N	\N	\N	\N	\N
121	10	155	2	f	2.295	gauntlet_4_r3	2026-07-16 16:56:01.679	f	\N	1	\N	\N	\N	\N	\N	\N
122	10	193	3	f	1.509	gauntlet_4_r3	2026-07-16 16:56:01.693	f	\N	1	\N	\N	\N	\N	\N	\N
123	10	152	3	f	1.388	gauntlet_4_r3	2026-07-16 16:56:01.702	f	\N	1	\N	\N	\N	\N	\N	\N
124	10	145	3	t	1.187	gauntlet_4_r3	2026-07-16 16:56:01.713	f	\N	1	\N	\N	\N	\N	\N	\N
125	10	160	3	f	1.952	gauntlet_4_r3	2026-07-16 16:56:01.721	f	\N	1	\N	\N	\N	\N	\N	\N
126	10	162	2	f	0.871	gauntlet_4_r3	2026-07-16 16:56:01.73	f	\N	1	\N	\N	\N	\N	\N	\N
127	10	161	2	f	1.618	gauntlet_4_r3	2026-07-16 16:56:01.738	f	\N	1	\N	\N	\N	\N	\N	\N
128	10	146	3	t	1.11	gauntlet_4_r3	2026-07-16 16:56:01.747	f	\N	1	\N	\N	\N	\N	\N	\N
129	10	151	2	f	1.147	gauntlet_4_r3	2026-07-16 16:56:01.756	f	\N	1	\N	\N	\N	\N	\N	\N
130	10	150	2	f	1.547	gauntlet_4_r3	2026-07-16 16:56:01.769	f	\N	1	\N	\N	\N	\N	\N	\N
131	2	148	1	f	1.703	gauntlet_3_r2	2026-07-26 17:45:12.28	f	\N	1	\N	\N	\N	\N	\N	\N
132	2	146	2	f	0.675	gauntlet_3_r2	2026-07-26 17:45:12.331	f	\N	1	\N	\N	\N	\N	\N	\N
133	2	193	2	f	0.696	gauntlet_3_r2	2026-07-26 17:45:12.382	f	\N	1	\N	\N	\N	\N	\N	\N
134	2	153	2	f	0.71	gauntlet_3_r2	2026-07-26 17:45:12.456	f	\N	1	\N	\N	\N	\N	\N	\N
135	2	152	1	f	0.758	gauntlet_3_r2	2026-07-26 17:45:12.496	f	\N	1	\N	\N	\N	\N	\N	\N
136	2	159	2	f	1.259	gauntlet_3_r2	2026-07-26 17:45:12.562	f	\N	1	\N	\N	\N	\N	\N	\N
137	2	154	3	t	0.657	gauntlet_3_r2	2026-07-26 17:45:12.602	f	\N	1	\N	\N	\N	\N	\N	\N
138	2	151	2	f	0.673	gauntlet_3_r2	2026-07-26 17:45:12.671	f	\N	1	\N	\N	\N	\N	\N	\N
139	2	147	3	f	0.628	gauntlet_3_r2	2026-07-26 17:45:12.711	f	\N	1	\N	\N	\N	\N	\N	\N
140	2	158	1	f	0.684	gauntlet_3_r2	2026-07-26 17:45:12.777	f	\N	1	\N	\N	\N	\N	\N	\N
141	73	355	1	f	5	gauntlet_6_r1	2026-08-03 16:41:44.544	f	\N	1	\N	\N	\N	\N	\N	\N
142	73	336	1	f	5	gauntlet_6_r1	2026-08-03 16:41:44.559	f	\N	1	\N	\N	\N	\N	\N	\N
143	73	337	1	f	5	gauntlet_6_r1	2026-08-03 16:41:44.563	f	\N	1	\N	\N	\N	\N	\N	\N
144	73	340	1	f	5	gauntlet_6_r1	2026-08-03 16:41:44.568	f	\N	1	\N	\N	\N	\N	\N	\N
145	73	333	1	t	5	gauntlet_6_r1	2026-08-03 16:41:44.573	f	\N	1	\N	\N	\N	\N	\N	\N
146	73	339	1	t	5	gauntlet_6_r1	2026-08-03 16:41:44.585	f	\N	1	\N	\N	\N	\N	\N	\N
147	73	353	1	f	5	gauntlet_6_r1	2026-08-03 16:41:44.59	f	\N	1	\N	\N	\N	\N	\N	\N
148	73	330	1	f	5	gauntlet_6_r1	2026-08-03 16:41:44.595	f	\N	1	\N	\N	\N	\N	\N	\N
149	73	329	1	f	5	gauntlet_6_r1	2026-08-03 16:41:44.6	f	\N	1	\N	\N	\N	\N	\N	\N
150	73	335	1	f	5	gauntlet_6_r1	2026-08-03 16:41:44.606	f	\N	1	\N	\N	\N	\N	\N	\N
151	76	332	1	f	2.412	gauntlet_9_r1	2026-08-03 18:55:36.911	f	\N	1	\N	\N	\N	\N	\N	\N
152	76	336	1	f	0.884	gauntlet_9_r1	2026-08-03 18:55:36.921	f	\N	1	\N	\N	\N	\N	\N	\N
153	76	340	1	f	0.862	gauntlet_9_r1	2026-08-03 18:55:36.925	f	\N	1	\N	\N	\N	\N	\N	\N
154	76	328	1	t	0.885	gauntlet_9_r1	2026-08-03 18:55:36.929	f	\N	1	\N	\N	\N	\N	\N	\N
155	76	326	1	f	0.864	gauntlet_9_r1	2026-08-03 18:55:36.933	f	\N	1	\N	\N	\N	\N	\N	\N
156	76	352	1	f	0.848	gauntlet_9_r1	2026-08-03 18:55:36.938	f	\N	1	\N	\N	\N	\N	\N	\N
157	76	335	1	t	0.859	gauntlet_9_r1	2026-08-03 18:55:36.941	f	\N	1	\N	\N	\N	\N	\N	\N
158	76	341	1	f	0.858	gauntlet_9_r1	2026-08-03 18:55:36.945	f	\N	1	\N	\N	\N	\N	\N	\N
159	76	337	1	t	0.871	gauntlet_9_r1	2026-08-03 18:55:36.947	f	\N	1	\N	\N	\N	\N	\N	\N
160	76	357	1	f	0.863	gauntlet_9_r1	2026-08-03 18:55:36.951	f	\N	1	\N	\N	\N	\N	\N	\N
161	77	335	1	f	2.229	gauntlet_10_r1	2026-08-03 18:57:31.767	f	\N	1	\N	\N	\N	\N	\N	\N
162	77	330	1	t	0.98	gauntlet_10_r1	2026-08-03 18:57:31.773	f	\N	1	\N	\N	\N	\N	\N	\N
163	77	336	1	t	0.962	gauntlet_10_r1	2026-08-03 18:57:31.775	f	\N	1	\N	\N	\N	\N	\N	\N
164	77	334	1	t	0.958	gauntlet_10_r1	2026-08-03 18:57:31.779	f	\N	1	\N	\N	\N	\N	\N	\N
165	77	351	1	f	0.971	gauntlet_10_r1	2026-08-03 18:57:31.784	f	\N	1	\N	\N	\N	\N	\N	\N
166	77	356	1	f	0.989	gauntlet_10_r1	2026-08-03 18:57:31.789	f	\N	1	\N	\N	\N	\N	\N	\N
167	77	353	1	f	0.962	gauntlet_10_r1	2026-08-03 18:57:31.792	f	\N	1	\N	\N	\N	\N	\N	\N
168	77	337	1	t	0.946	gauntlet_10_r1	2026-08-03 18:57:31.794	f	\N	1	\N	\N	\N	\N	\N	\N
169	77	331	1	f	0.974	gauntlet_10_r1	2026-08-03 18:57:31.797	f	\N	1	\N	\N	\N	\N	\N	\N
170	77	352	1	t	0.96	gauntlet_10_r1	2026-08-03 18:57:31.8	f	\N	1	\N	\N	\N	\N	\N	\N
171	74	332	1	f	2.269	gauntlet_7_r1	2026-08-03 19:04:42.215	f	\N	1	\N	\N	\N	\N	\N	\N
172	74	327	2	f	1.019	gauntlet_7_r1	2026-08-03 19:04:42.238	f	\N	1	\N	\N	\N	\N	\N	\N
173	74	340	2	t	1.44	gauntlet_7_r1	2026-08-03 19:04:42.286	f	\N	1	\N	\N	\N	\N	\N	\N
174	74	333	1	f	1.619	gauntlet_7_r1	2026-08-03 19:04:42.318	f	\N	1	\N	\N	\N	\N	\N	\N
175	74	338	4	t	2.101	gauntlet_7_r1	2026-08-03 19:04:42.348	f	\N	1	\N	\N	\N	\N	\N	\N
176	74	334	2	t	1.71	gauntlet_7_r1	2026-08-03 19:04:42.367	f	\N	1	\N	\N	\N	\N	\N	\N
177	74	328	1	f	2.03	gauntlet_7_r1	2026-08-03 19:04:42.398	f	\N	1	\N	\N	\N	\N	\N	\N
178	74	337	2	f	1.504	gauntlet_7_r1	2026-08-03 19:04:42.416	f	\N	1	\N	\N	\N	\N	\N	\N
179	74	339	1	f	1.377	gauntlet_7_r1	2026-08-03 19:04:42.447	f	\N	1	\N	\N	\N	\N	\N	\N
180	74	335	2	f	2.574	gauntlet_7_r1	2026-08-03 19:04:42.465	f	\N	1	\N	\N	\N	\N	\N	\N
181	2	334	1	f	7.585	gauntlet_3_r3	2026-08-13 13:35:45.269	f	\N	1	\N	\N	\N	\N	\N	\N
182	2	331	2	f	0.832	gauntlet_3_r3	2026-08-13 13:35:45.287	f	\N	1	\N	\N	\N	\N	\N	\N
183	2	339	3	f	0.528	gauntlet_3_r3	2026-08-13 13:35:45.298	f	\N	1	\N	\N	\N	\N	\N	\N
184	2	369	4	f	0.491	gauntlet_3_r3	2026-08-13 13:35:45.306	f	\N	1	\N	\N	\N	\N	\N	\N
185	2	372	2	f	0.478	gauntlet_3_r3	2026-08-13 13:35:45.316	f	\N	1	\N	\N	\N	\N	\N	\N
186	2	362	1	f	0.456	gauntlet_3_r3	2026-08-13 13:35:45.325	f	\N	1	\N	\N	\N	\N	\N	\N
187	2	336	2	f	0.433	gauntlet_3_r3	2026-08-13 13:35:45.337	f	\N	1	\N	\N	\N	\N	\N	\N
188	2	329	2	t	0.546	gauntlet_3_r3	2026-08-13 13:35:45.346	f	\N	1	\N	\N	\N	\N	\N	\N
189	2	385	3	f	0.692	gauntlet_3_r3	2026-08-13 13:35:45.355	f	\N	1	\N	\N	\N	\N	\N	\N
190	2	341	1	f	0.905	gauntlet_3_r3	2026-08-13 13:35:45.364	f	\N	1	\N	\N	\N	\N	\N	\N
\.


--
-- Data for Name: character_interactions; Type: TABLE DATA; Schema: public; Owner: geek
--

COPY public.character_interactions (id, "userId", "character", "interactionType", message, context, "timestamp") FROM stdin;
\.


--
-- Data for Name: creator_earnings; Type: TABLE DATA; Schema: public; Owner: geek
--

COPY public.creator_earnings (id, "creatorId", "questionId", amount, "timestamp", "sessionId", "playerId") FROM stdin;
\.


--
-- Data for Name: dust_transactions; Type: TABLE DATA; Schema: public; Owner: geek
--

COPY public.dust_transactions (id, "userId", amount, reason, "stickerId", "timestamp") FROM stdin;
\.


--
-- Data for Name: economy_config; Type: TABLE DATA; Schema: public; Owner: geek
--

COPY public.economy_config (id, "pointsPerGeek", "minimumPoints", "exchangeListingExpiryHours", "updatedAt") FROM stdin;
\.


--
-- Data for Name: exchange_listings; Type: TABLE DATA; Schema: public; Owner: geek
--

COPY public.exchange_listings (id, "sellerId", "sellerUserStickerId", "stickerId", "askPriceGeek", "requestedStickerIdsJson", status, "createdAt", "expiresAt", "completedAt", "cancelledAt", "completedById") FROM stdin;
\.


--
-- Data for Name: exchange_offers; Type: TABLE DATA; Schema: public; Owner: geek
--

COPY public.exchange_offers (id, "listingId", "offererId", "offeredUserStickerIdsJson", note, status, "createdAt") FROM stdin;
\.


--
-- Data for Name: exchange_transactions; Type: TABLE DATA; Schema: public; Owner: geek
--

COPY public.exchange_transactions (id, "listingId", "sellerId", "buyerId", "txType", "geekAmount", "sellerStickerId", "buyerStickerIdsJson", "createdAt") FROM stdin;
\.


--
-- Data for Name: gauntlet_claims; Type: TABLE DATA; Schema: public; Owner: geek
--

COPY public.gauntlet_claims (id, "userId", "runId", amount, status, "timestamp") FROM stdin;
1	2	1	182	claimed	2026-07-16 12:52:07.333
2	2	1	182	claimed	2026-07-16 12:52:07.337
3	2	2	36	claimed	2026-07-16 15:11:18.472
4	2	3	152	claimed	2026-08-13 13:35:54.025
\.


--
-- Data for Name: gauntlet_runs; Type: TABLE DATA; Schema: public; Owner: geek
--

COPY public.gauntlet_runs (id, "userId", "highestRound", "totalCorrect", "totalQuestions", "totalGeekEarned", "totalXpEarned", "selectedTopics", completed, "activeRound", "activeState", "activeStateUpdatedAt", "dateStarted", "dateCompleted") FROM stdin;
10	77	1	5	10	50	75	["Kaspa Origins","Tokenomics","GHOSTDAG & BlockDAG"]	f	2	{"geekEarned":50,"xpEarned":75,"roundResults":[{"round":1,"correctCount":5,"geekEarned":50,"xpEarned":75}],"paidRounds":[],"activeModifier":null}	2026-08-03 18:57:31.802	2026-08-03 18:57:07.246	\N
7	74	1	3	10	30	45	["Kaspa Origins","GHOSTDAG & BlockDAG"]	f	2	{"geekEarned":30,"xpEarned":45,"roundResults":[{"round":1,"correctCount":3,"geekEarned":30,"xpEarned":45}],"paidRounds":[],"activeModifier":null}	2026-08-03 19:04:42.495	2026-08-03 18:38:32.419	\N
3	2	3	6	30	152	90	["Sci-Fi & Fantasy","Video Games","Movies & TV"]	t	4	{"geekEarned":152,"xpEarned":90,"roundResults":[{"round":1,"correctCount":4,"geekEarned":48,"xpEarned":60},{"round":2,"correctCount":1,"geekEarned":24,"xpEarned":15},{"round":3,"correctCount":1,"geekEarned":80,"xpEarned":15}],"paidRounds":[2,3],"activeModifier":null}	2026-08-13 13:35:45.371	2026-07-16 15:27:49.546	2026-08-13 13:35:53.989
4	10	3	8	30	180	120	["Sci-Fi & Fantasy","Video Games","Movies & TV"]	f	4	{"geekEarned":180,"xpEarned":120,"roundResults":[{"round":1,"correctCount":5,"geekEarned":60,"xpEarned":75},{"round":2,"correctCount":1,"geekEarned":24,"xpEarned":15},{"round":3,"correctCount":2,"geekEarned":96,"xpEarned":30}],"paidRounds":[2,3,4],"activeModifier":"double_down"}	2026-07-16 16:56:13.03	2026-07-16 16:40:07.375	\N
5	72	0	0	0	0	0	["Kaspa Origins","Tokenomics"]	f	1	{"geekEarned":0,"xpEarned":0,"roundResults":[],"paidRounds":[],"activeModifier":null}	2026-08-03 16:36:15.608	2026-08-03 16:36:15.302	\N
1	2	3	6	30	182	90	["Video Games","Sci-Fi & Fantasy","Movies & TV"]	t	4	{"geekEarned":182,"xpEarned":90,"roundResults":[{"round":1,"correctCount":3,"geekEarned":36,"xpEarned":45},{"round":2,"correctCount":2,"geekEarned":48,"xpEarned":30},{"round":3,"correctCount":1,"geekEarned":48,"xpEarned":15}],"paidRounds":[2,3],"activeModifier":null}	2026-07-16 12:52:04.252	2026-06-26 12:51:12.419	2026-07-16 12:52:07.318
6	73	1	2	10	22	30	["Kaspa Origins","Tokenomics","GHOSTDAG & BlockDAG"]	f	2	{"geekEarned":22,"xpEarned":30,"roundResults":[{"round":1,"correctCount":2,"geekEarned":22,"xpEarned":30}],"paidRounds":[],"activeModifier":null}	2026-08-03 16:41:44.611	2026-08-03 16:41:35.143	\N
2	2	1	3	10	36	45	["Sci-Fi & Fantasy","Video Games","Movies & TV"]	t	2	{"geekEarned":36,"xpEarned":45,"roundResults":[{"round":1,"correctCount":3,"geekEarned":36,"xpEarned":45}],"paidRounds":[],"activeModifier":null}	2026-07-16 15:09:24.492	2026-07-16 15:08:40.248	2026-07-16 15:11:18.449
8	75	0	0	0	0	0	["Kaspa Origins","Tokenomics","GHOSTDAG & BlockDAG"]	f	1	{"geekEarned":0,"xpEarned":0,"roundResults":[],"paidRounds":[],"activeModifier":null}	2026-08-03 18:47:52.205	2026-08-03 18:47:46.396	\N
9	76	1	3	10	30	45	["Kaspa Origins","Tokenomics","GHOSTDAG & BlockDAG"]	f	2	{"geekEarned":30,"xpEarned":45,"roundResults":[{"round":1,"correctCount":3,"geekEarned":30,"xpEarned":45}],"paidRounds":[],"activeModifier":null}	2026-08-03 18:55:36.952	2026-08-03 18:55:08.503	\N
\.


--
-- Data for Name: geek_dust; Type: TABLE DATA; Schema: public; Owner: geek
--

COPY public.geek_dust (id, "userId", amount, "totalEarned", "totalSpent", "updatedAt") FROM stdin;
\.


--
-- Data for Name: kaspa_payments; Type: TABLE DATA; Schema: public; Owner: geek
--

COPY public.kaspa_payments (id, "userId", "transactionId", "kaspaAmount", "geekAmount", rate, status, "walletAddress", confirmations, "createdAt", "confirmedAt", "paymentReference", "expiresAt", "sompiAmount") FROM stdin;
\.


--
-- Data for Name: kaspa_prices; Type: TABLE DATA; Schema: public; Owner: geek
--

COPY public.kaspa_prices (id, "usdPrice", "geekPerKas", "updatedAt") FROM stdin;
\.


--
-- Data for Name: kyc_verifications; Type: TABLE DATA; Schema: public; Owner: geek
--

COPY public.kyc_verifications (id, "userId", status, provider, "providerId", "firstName", "lastName", email, phone, "dateOfBirth", address, city, state, "postalCode", country, "idDocumentType", "idDocumentUrl", "submittedAt", "reviewedAt", "reviewedBy", "rejectionReason", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: points_conversion_transactions; Type: TABLE DATA; Schema: public; Owner: geek
--

COPY public.points_conversion_transactions (id, "userId", "pointsSpent", "geekReceived", "ratePointsPerGeek", "createdAt") FROM stdin;
\.


--
-- Data for Name: purchases; Type: TABLE DATA; Schema: public; Owner: geek
--

COPY public.purchases (id, "userId", "fiatAmount", "fiatCurrency", "kasEquivalent", "geekAmount", "stripeSessionId", status, "lockedRate", "createdAt") FROM stdin;
\.


--
-- Data for Name: question_validations; Type: TABLE DATA; Schema: public; Owner: geek
--

COPY public.question_validations (id, "questionId", "validatorId", action, "pointsAwarded", "geekAwarded", "timestamp", "reviewTime", "detailedFeedback") FROM stdin;
\.


--
-- Data for Name: questions; Type: TABLE DATA; Schema: public; Owner: geek
--

COPY public.questions (id, question, option1, option2, option3, option4, "correctOption", difficulty, "topicId", "createdBy", status, "approvedBy", "validatedBy", "dateCreated", "sourceLink", subtopic, "funFact", "approvalsCount", "rejectionsCount", "totalReviews", "dateApproved", "totalServes", "totalEarned", "averageTimeToAnswer", "skipRate", "playerRating", "aiDifficultyScore", "topicTags", "yearReleased", "dateFirstServed", "dateLastServed") FROM stdin;
153	What is the primary element used in Avatar: The Last Airbender for energy and flight?	Firebending	Earthbending	Waterbending	Airbending	4	medium	26	\N	archived	\N	\N	2026-06-26 11:27:52.156	\N	\N	\N	0	0	0	2026-06-26 11:27:52.155	0	0	0	0	0	0	["Animation","Fantasy"]	\N	\N	\N
326	Who is the researcher credited with founding Kaspa?	Vitalik Buterin	Yonatan Sompolinsky	Charles Hoskinson	Gavin Wood	2	easy	35	\N	approved	\N	\N	2026-08-03 16:23:48.634	\N	\N	Sompolinsky's earlier research on the GHOST protocol was cited in Ethereum's own whitepaper.	0	0	0	2026-08-03 16:24:06.227	0	0	0	0	0	0	["founder","history"]	\N	\N	\N
327	In what year did Kaspa launch its mainnet?	2019	2020	2021	2023	3	easy	35	\N	approved	\N	\N	2026-08-03 16:23:48.648	\N	\N	Kaspa went live on 7 November 2021 with no premine and no pre-sale.	0	0	0	2026-08-03 16:24:06.238	0	0	0	0	0	0	["launch"]	\N	\N	\N
328	What does it mean that Kaspa had a 'fair launch'?	Early investors received a discount round	No premine, no pre-sale and no allocation to founders or VCs	The team held 10% for development	Tokens were airdropped to Bitcoin holders	2	medium	35	\N	approved	\N	\N	2026-08-03 16:23:48.653	\N	\N	Every KAS in existence was mined — nobody, including the founders, was allocated coins at genesis.	0	0	0	2026-08-03 16:24:06.244	0	0	0	0	0	0	["fair-launch","distribution"]	\N	\N	\N
329	Sompolinsky co-authored a 2013 paper whose ideas influenced Ethereum's handling of orphaned blocks. What was that protocol called?	GHOST	CASPER	RAIDEN	PLASMA	1	hard	35	\N	approved	\N	\N	2026-08-03 16:23:48.658	\N	\N	GHOST — Greedy Heaviest Observed Sub-Tree — led to Ethereum's uncle/ommer rewards.	0	0	0	2026-08-03 16:24:06.251	0	0	0	0	0	0	["research","ghost"]	\N	\N	\N
330	Which academic protocol is GHOSTDAG a practical, greedy implementation of?	PHANTOM	AVALANCHE	TENDERMINT	HASHGRAPH	1	hard	35	\N	approved	\N	\N	2026-08-03 16:23:48.664	\N	\N	The PHANTOM paper defines the ideal ordering; GHOSTDAG approximates it efficiently.	0	0	0	2026-08-03 16:24:06.258	0	0	0	0	0	0	["research","phantom"]	\N	\N	\N
331	What is Kaspa's ticker symbol?	KSP	KAS	KPA	KSA	2	easy	35	\N	approved	\N	\N	2026-08-03 16:23:48.669	\N	\N	\N	0	0	0	2026-08-03 16:24:06.265	0	0	0	0	0	0	["basics"]	\N	\N	\N
332	The original Kaspa full node was written in one language, then rewritten for performance in another. Which rewrite is known as 'rusty-kaspa'?	Python to C++	Go to Rust	Java to Go	C to Zig	2	medium	35	\N	approved	\N	\N	2026-08-03 16:23:48.674	\N	\N	The original node (kaspad) was written in Go; the Rust rewrite unlocked much higher block rates.	0	0	0	2026-08-03 16:24:06.271	0	0	0	0	0	0	["engineering"]	\N	\N	\N
333	What is the name of the proposed next-generation successor protocol to GHOSTDAG?	DAGKnight	GHOSTNET	PHANTOM II	KaspaX	1	hard	35	\N	approved	\N	\N	2026-08-03 16:23:48.679	\N	\N	DAGKnight is designed to be parameterless — it adapts to real network conditions instead of assuming a fixed delay.	0	0	0	2026-08-03 16:24:06.276	0	0	0	0	0	0	["research","dagknight"]	\N	\N	\N
334	What does DAG stand for in 'blockDAG'?	Distributed Access Gateway	Directed Acyclic Graph	Dynamic Allocation Grid	Decentralised Autonomous Group	2	easy	36	\N	approved	\N	\N	2026-08-03 16:23:48.684	\N	\N	\N	0	0	0	2026-08-03 16:24:06.281	0	0	0	0	0	0	["basics","dag"]	\N	\N	\N
335	In a traditional blockchain, what happens when two miners find a valid block at the same time?	Both blocks are kept and ordered	One block wins and the other is orphaned and discarded	The blocks are merged into one	The network halts until miners agree	2	medium	36	\N	approved	\N	\N	2026-08-03 16:23:48.689	\N	\N	Discarding that work is exactly the waste GHOSTDAG was designed to eliminate.	0	0	0	2026-08-03 16:24:06.286	0	0	0	0	0	0	["comparison"]	\N	\N	\N
337	In GHOSTDAG terminology, what are 'blue' blocks?	Blocks that paid the highest fees	Blocks that are well-connected to the DAG and considered part of the honest cluster	Blocks mined by ASIC hardware	Blocks containing no transactions	2	hard	36	\N	approved	\N	\N	2026-08-03 16:23:48.7	\N	\N	Poorly-connected blocks are coloured 'red' — still recorded, but treated as outside the honest set.	0	0	0	2026-08-03 16:24:06.298	0	0	0	0	0	0	["ghostdag","blue-set"]	\N	\N	\N
338	Why can a blockDAG safely support far higher block rates than a single chain?	It uses a faster hashing algorithm	Parallel blocks are ordered rather than discarded, so orphan rate stops being a limit	It reduces the number of miners	It skips validation for most blocks	2	hard	36	\N	approved	\N	\N	2026-08-03 16:23:48.705	\N	\N	\N	0	0	0	2026-08-03 16:24:06.303	0	0	0	0	0	0	["scaling"]	\N	\N	\N
339	Does GHOSTDAG give every transaction a single agreed order?	No, ordering is left to each node	Yes, it produces one consensus ordering across the whole DAG	Only for transactions in blue blocks	Only once per day at a checkpoint	2	medium	36	\N	approved	\N	\N	2026-08-03 16:23:48.71	\N	\N	A total order matters — without it you cannot reliably decide which of two conflicting spends came first.	0	0	0	2026-08-03 16:24:06.308	0	0	0	0	0	0	["ordering"]	\N	\N	\N
340	Kaspa is best described as which of the following?	A proof-of-stake smart contract platform	A proof-of-work blockDAG	A permissioned enterprise ledger	A Bitcoin sidechain	2	easy	36	\N	approved	\N	\N	2026-08-03 16:23:48.715	\N	\N	\N	0	0	0	2026-08-03 16:24:06.313	0	0	0	0	0	0	["basics"]	\N	\N	\N
341	What problem does high block rate cause in a classic blockchain that GHOSTDAG solves?	Wallets stop syncing	Rising orphan rates waste hash power and weaken security	Transaction fees become negative	Blocks exceed the maximum file size	2	hard	36	\N	approved	\N	\N	2026-08-03 16:23:48.72	\N	\N	\N	0	0	0	2026-08-03 16:24:06.319	0	0	0	0	0	0	["security","scaling"]	\N	\N	\N
342	Which consensus mechanism secures Kaspa?	Proof of Stake	Proof of Work	Proof of Authority	Proof of History	2	easy	37	\N	approved	\N	\N	2026-08-03 16:23:48.725	\N	\N	\N	0	0	0	2026-08-03 16:24:06.324	0	0	0	0	0	0	["basics","pow"]	\N	\N	\N
343	What is the name of Kaspa's proof-of-work hashing algorithm?	SHA-256	Ethash	kHeavyHash	Scrypt	3	medium	37	\N	approved	\N	\N	2026-08-03 16:23:48.73	\N	\N	kHeavyHash was designed with optical mining hardware in mind — a bet on a very different future for mining efficiency.	0	0	0	2026-08-03 16:24:06.329	0	0	0	0	0	0	["mining","kheavyhash"]	\N	\N	\N
344	What did Kaspa's block rate start at when the network launched?	1 block per second	1 block per minute	10 blocks per second	1 block per 10 minutes	1	medium	37	\N	approved	\N	\N	2026-08-03 16:23:48.757	\N	\N	One block per second was already extraordinary — Bitcoin targets one every ten minutes.	0	0	0	2026-08-03 16:24:06.335	0	0	0	0	0	0	["block-rate"]	\N	\N	\N
345	What was the Crescendo upgrade designed to do?	Switch Kaspa to proof of stake	Raise the block rate to ten blocks per second	Introduce a founder's reward	Reduce the maximum supply	2	medium	37	\N	approved	\N	\N	2026-08-03 16:23:48.762	\N	\N	\N	0	0	0	2026-08-03 16:24:06.341	0	0	0	0	0	0	["upgrade","crescendo"]	\N	\N	\N
346	Roughly how long does Bitcoin target between blocks, for comparison with Kaspa?	1 second	1 minute	10 minutes	1 hour	3	easy	37	\N	approved	\N	\N	2026-08-03 16:23:48.768	\N	\N	\N	0	0	0	2026-08-03 16:24:06.347	0	0	0	0	0	0	["comparison","bitcoin"]	\N	\N	\N
347	What secures a proof-of-work network against an attacker rewriting history?	A council of validators	The cost of redoing the accumulated computational work	Government registration of miners	Encrypting every block with a private key	2	medium	37	\N	approved	\N	\N	2026-08-03 16:23:48.773	\N	\N	\N	0	0	0	2026-08-03 16:24:06.353	0	0	0	0	0	0	["security"]	\N	\N	\N
348	Why does faster confirmation matter for a network used to pay people in real time?	It reduces the total coin supply	Users learn their transaction is settled in seconds rather than minutes	It removes the need for mining	It makes transactions free	2	easy	37	\N	approved	\N	\N	2026-08-03 16:23:48.778	\N	\N	\N	0	0	0	2026-08-03 16:24:06.359	0	0	0	0	0	0	["ux"]	\N	\N	\N
349	In Kaspa, are blocks mined in parallel by different miners wasted?	Yes, only one survives	No, they are all incorporated into the DAG	Only blocks over 1MB survive	They are queued for the next epoch	2	easy	37	\N	approved	\N	\N	2026-08-03 16:23:48.784	\N	\N	\N	0	0	0	2026-08-03 16:24:06.365	0	0	0	0	0	0	["ghostdag"]	\N	\N	\N
350	Approximately what is Kaspa's maximum supply?	21 million	100 million	28.7 billion	1 trillion	3	medium	38	\N	approved	\N	\N	2026-08-03 16:23:48.79	\N	\N	The precise cap is 28,704,026,601 KAS.	0	0	0	2026-08-03 16:24:06.37	0	0	0	0	0	0	["supply"]	\N	\N	\N
351	What is the smallest unit of KAS called?	satoshi	sompi	wei	gwei	2	medium	38	\N	approved	\N	\N	2026-08-03 16:23:48.795	\N	\N	The sompi is named after Yonatan Sompolinsky. One KAS is 100,000,000 sompi.	0	0	0	2026-08-03 16:24:06.376	0	0	0	0	0	0	["units"]	\N	\N	\N
352	How many sompi make up one KAS?	1,000	1,000,000	100,000,000	1,000,000,000	3	medium	38	\N	approved	\N	\N	2026-08-03 16:23:48.801	\N	\N	\N	0	0	0	2026-08-03 16:24:06.381	0	0	0	0	0	0	["units"]	\N	\N	\N
354	How much of Kaspa's supply was allocated to founders and investors at launch?	None	5%	15%	30%	1	easy	38	\N	approved	\N	\N	2026-08-03 16:23:48.813	\N	\N	No premine, no pre-sale, no VC allocation — all coins entered circulation through mining.	0	0	0	2026-08-03 16:24:06.393	0	0	0	0	0	0	["fair-launch"]	\N	\N	\N
355	Why does a smooth monthly emission reduction differ from a sudden halving?	It avoids the abrupt shock to miner revenue that a cliff creates	It increases the total supply	It lets the team mint extra coins	It stops mining entirely	1	hard	38	\N	approved	\N	\N	2026-08-03 16:23:48.818	\N	\N	\N	0	0	0	2026-08-03 16:24:06.398	0	0	0	0	0	0	["emission"]	\N	\N	\N
356	Is Kaspa's supply inflationary without limit?	Yes, new coins are minted forever at a fixed rate	No, emission decreases over time toward a hard cap	Yes, supply doubles annually	Supply is set by governance vote	2	easy	38	\N	approved	\N	\N	2026-08-03 16:23:48.823	\N	\N	\N	0	0	0	2026-08-03 16:24:06.404	0	0	0	0	0	0	["supply"]	\N	\N	\N
358	What prefix does a Kaspa mainnet address start with?	kas1:	kaspa:	0x	bc1	2	easy	39	\N	approved	\N	\N	2026-08-03 16:23:48.833	\N	\N	Testnet addresses use the kaspatest: prefix instead.	0	0	0	2026-08-03 16:24:06.414	0	0	0	0	0	0	["addresses"]	\N	\N	\N
359	Which accounting model does Kaspa use?	Account/balance, like Ethereum	UTXO, like Bitcoin	A permissioned ledger table	Off-chain state channels only	2	medium	39	\N	approved	\N	\N	2026-08-03 16:23:48.838	\N	\N	UTXO means your balance is the sum of unspent outputs you control, not a single stored number.	0	0	0	2026-08-03 16:24:06.419	0	0	0	0	0	0	["utxo"]	\N	\N	\N
360	What does UTXO stand for?	Universal Transaction Exchange Output	Unspent Transaction Output	Unified Token Extension Object	User Transfer Operation	2	medium	39	\N	approved	\N	\N	2026-08-03 16:23:48.844	\N	\N	\N	0	0	0	2026-08-03 16:24:06.425	0	0	0	0	0	0	["utxo"]	\N	\N	\N
361	Which browser extension wallet is commonly used with Kaspa applications?	MetaMask	KasWare	Phantom	Keplr	2	easy	39	\N	approved	\N	\N	2026-08-03 16:23:48.849	\N	\N	\N	0	0	0	2026-08-03 16:24:06.43	0	0	0	0	0	0	["wallets"]	\N	\N	\N
363	What is the safest way to store a seed phrase?	A screenshot in your photo library	Offline, physically, somewhere only you can access	A note in your email drafts	A public gist as a backup	2	easy	39	\N	approved	\N	\N	2026-08-03 16:23:48.859	\N	\N	\N	0	0	0	2026-08-03 16:24:06.441	0	0	0	0	0	0	["security"]	\N	\N	\N
364	A Kaspa address contains a checksum. What does that protect against?	Someone stealing your private key	Funds being sent to an address you mistyped	Double spending	Network congestion	2	medium	39	\N	approved	\N	\N	2026-08-03 16:23:48.864	\N	\N	Change a single character and the checksum fails, so the wallet rejects it before any funds move.	0	0	0	2026-08-03 16:24:06.446	0	0	0	0	0	0	["addresses","safety"]	\N	\N	\N
365	What does 'signing a message' with your wallet prove?	That you control the private key for that address	That you have a positive balance	That you paid a transaction fee	That your node is fully synced	1	medium	39	\N	approved	\N	\N	2026-08-03 16:23:48.869	\N	\N	This is exactly how logging in with a wallet works — no password required.	0	0	0	2026-08-03 16:24:06.452	0	0	0	0	0	0	["signatures","auth"]	\N	\N	\N
366	What is KRC-20?	A Kaspa mining pool protocol	A token standard for issuing fungible tokens on Kaspa	A hardware wallet model	A block explorer	2	easy	40	\N	approved	\N	\N	2026-08-03 16:23:48.875	\N	\N	\N	0	0	0	2026-08-03 16:24:06.457	0	0	0	0	0	0	["krc20","tokens"]	\N	\N	\N
367	Which Ethereum standard is KRC-20 most analogous to?	ERC-721	ERC-20	ERC-1155	ERC-4337	2	easy	40	\N	approved	\N	\N	2026-08-03 16:23:48.88	\N	\N	ERC-20 and KRC-20 both describe fungible tokens — interchangeable units, like currency.	0	0	0	2026-08-03 16:24:06.462	0	0	0	0	0	0	["krc20","comparison"]	\N	\N	\N
368	KRC-20 tokens are created using which mechanism?	Deploying bytecode to a virtual machine	Inscribing structured data into transactions, tracked by an indexer	Registering with a central authority	Staking KAS in a contract	2	hard	40	\N	approved	\N	\N	2026-08-03 16:23:48.885	\N	\N	Because it's inscription-based, an indexer is what reconstructs token balances from the chain's history.	0	0	0	2026-08-03 16:24:06.467	0	0	0	0	0	0	["krc20","inscriptions"]	\N	\N	\N
369	What role does an indexer play for KRC-20 tokens?	It mines the tokens	It reads the chain and computes token balances and transfers	It sets the token's price	It stores private keys	2	hard	40	\N	approved	\N	\N	2026-08-03 16:23:48.89	\N	\N	\N	0	0	0	2026-08-03 16:24:06.472	0	0	0	0	0	0	["krc20","indexer"]	\N	\N	\N
370	What does 'fungible' mean when describing a token?	Each unit is unique and non-interchangeable	Every unit is identical and interchangeable with any other	It can only be traded once	It expires after a fixed period	2	medium	40	\N	approved	\N	\N	2026-08-03 16:23:48.895	\N	\N	\N	0	0	0	2026-08-03 16:24:06.478	0	0	0	0	0	0	["concepts"]	\N	\N	\N
371	What is a token 'ticker' in the KRC-20 context?	The short symbol identifying the token	The transaction fee	The block time	The wallet address	1	easy	40	\N	approved	\N	\N	2026-08-03 16:23:48.901	\N	\N	\N	0	0	0	2026-08-03 16:24:06.483	0	0	0	0	0	0	["krc20"]	\N	\N	\N
372	Why does adding a programmable layer increase the security burden on a network?	It slows down block production	Programmable value introduces bugs and exploits that simple transfers do not	It requires more miners by law	It removes proof of work	2	hard	40	\N	approved	\N	\N	2026-08-03 16:23:48.907	\N	\N	\N	0	0	0	2026-08-03 16:24:06.488	0	0	0	0	0	0	["security","smart-contracts"]	\N	\N	\N
373	What is a Layer 2 in blockchain terms?	A backup copy of the blockchain	A separate system that handles execution while relying on the base chain for security	The second half of a block	A type of wallet	2	medium	40	\N	approved	\N	\N	2026-08-03 16:23:48.912	\N	\N	\N	0	0	0	2026-08-03 16:24:06.493	0	0	0	0	0	0	["l2","concepts"]	\N	\N	\N
374	What is a block explorer used for?	Mining new blocks	Viewing transactions, addresses and blocks on the network	Storing your private keys	Setting transaction fees network-wide	2	easy	41	\N	approved	\N	\N	2026-08-03 16:23:48.917	\N	\N	\N	0	0	0	2026-08-03 16:24:06.498	0	0	0	0	0	0	["tools"]	\N	\N	\N
375	Kaspa's core development is notable for which of the following?	Being run by a single corporation	Being open source with a relatively small group of contributors	Being closed source	Requiring a licence fee to build on	2	medium	41	\N	approved	\N	\N	2026-08-03 16:23:48.922	\N	\N	A small contributor base is a real consideration when you build on any chain — fewer maintainers means fewer ready-made tools.	0	0	0	2026-08-03 16:24:06.503	0	0	0	0	0	0	["community"]	\N	\N	\N
376	What does it mean that Kaspa is open source?	Anyone can read, audit and contribute to the code	The code is owned by a foundation and kept private	Only miners can view the code	It costs money to access	1	easy	41	\N	approved	\N	\N	2026-08-03 16:23:48.926	\N	\N	\N	0	0	0	2026-08-03 16:24:06.509	0	0	0	0	0	0	["open-source"]	\N	\N	\N
377	Why do developers run their own node rather than trusting a public API?	It is cheaper to mine that way	It removes reliance on a third party for the truth about the chain	It increases their token balance	It is legally required	2	medium	41	\N	approved	\N	\N	2026-08-03 16:23:48.931	\N	\N	\N	0	0	0	2026-08-03 16:24:06.514	0	0	0	0	0	0	["nodes"]	\N	\N	\N
149	What is the primary objective in Minecraft?	Defeat the Ender Dragon	Build and explore freely	Complete levels	Defeat the Wither	2	easy	25	\N	archived	\N	\N	2026-06-26 11:27:52.146	\N	\N	\N	0	0	0	2026-06-26 11:27:52.145	0	0	0	0	0	0	["Sandbox","Survival"]	\N	\N	\N
150	In The Legend of Zelda: Ocarina of Time, what is Link's primary childhood companion?	Epona	Navi	Midna	Tatl	2	medium	25	\N	archived	\N	\N	2026-06-26 11:27:52.149	\N	\N	\N	0	0	0	2026-06-26 11:27:52.148	0	0	0	0	0	0	["Nintendo","Adventure"]	\N	\N	\N
151	Who wrote the Harry Potter series?	J.K. Rowling	J.R.R. Tolkien	George R.R. Martin	Terry Pratchett	1	easy	26	\N	archived	\N	\N	2026-06-26 11:27:52.151	\N	\N	\N	0	0	0	2026-06-26 11:27:52.151	0	0	0	0	0	0	["Literature","Fantasy"]	\N	\N	\N
152	In Star Wars, what is the name of Han Solo's ship?	X-Wing	Millennium Falcon	TIE Fighter	A-Wing	2	easy	26	\N	archived	\N	\N	2026-06-26 11:27:52.154	\N	\N	\N	0	0	0	2026-06-26 11:27:52.153	0	0	0	0	0	0	["Movies","Star Wars"]	\N	\N	\N
378	What is a testnet used for?	Trading tokens at a discount	Testing applications with valueless coins before deploying to mainnet	Mining faster than mainnet	Storing backups of mainnet	2	easy	41	\N	approved	\N	\N	2026-08-03 16:23:48.935	\N	\N	Testnet coins have no monetary value by design — that is what makes them safe to experiment with.	0	0	0	2026-08-03 16:24:06.52	0	0	0	0	0	0	["testnet"]	\N	\N	\N
379	What is a mining pool?	A group of miners combining hash power and sharing rewards	A liquidity pool for trading	A staking contract	A storage system for blocks	1	medium	41	\N	approved	\N	\N	2026-08-03 16:23:48.94	\N	\N	\N	0	0	0	2026-08-03 16:24:06.525	0	0	0	0	0	0	["mining"]	\N	\N	\N
380	Why is it risky to rely on a single third-party service for on-chain data?	It makes transactions slower	If it goes down or reports wrongly, your application inherits that failure	It increases mining difficulty	It reduces your token supply	2	hard	41	\N	approved	\N	\N	2026-08-03 16:23:48.946	\N	\N	\N	0	0	0	2026-08-03 16:24:06.531	0	0	0	0	0	0	["architecture"]	\N	\N	\N
381	What does 'decentralised' mean in the context of a network like Kaspa?	No single party controls the network's operation	The network has no rules	All users must be anonymous	It runs on a single powerful server	1	easy	41	\N	approved	\N	\N	2026-08-03 16:23:48.951	\N	\N	\N	0	0	0	2026-08-03 16:24:06.536	0	0	0	0	0	0	["concepts"]	\N	\N	\N
382	What is a cryptographic hash function?	A reversible encryption method	A one-way function mapping any input to a fixed-size output	A way to compress files losslessly	A random number generator	2	medium	42	\N	approved	\N	\N	2026-08-03 16:23:48.956	\N	\N	\N	0	0	0	2026-08-03 16:24:06.541	0	0	0	0	0	0	["cryptography"]	\N	\N	\N
383	What is a 'double spend'?	Paying twice the network fee	Spending the same coins in two conflicting transactions	Sending funds to two addresses at once	Buying and selling in one block	2	medium	42	\N	approved	\N	\N	2026-08-03 16:23:48.961	\N	\N	Preventing double spends without a central authority is the original problem Bitcoin solved.	0	0	0	2026-08-03 16:24:06.547	0	0	0	0	0	0	["security"]	\N	\N	\N
384	What is the relationship between a private key and a public address?	The address is derived from the key, and the derivation cannot be reversed	They are the same value in different formats	The key is derived from the address	They are unrelated and assigned by the network	1	hard	42	\N	approved	\N	\N	2026-08-03 16:23:48.965	\N	\N	\N	0	0	0	2026-08-03 16:24:06.552	0	0	0	0	0	0	["cryptography","keys"]	\N	\N	\N
385	What does 'immutable' mean when describing a confirmed blockchain transaction?	It can be edited by the sender	It cannot practically be altered or removed once settled	It expires after a year	It is hidden from other users	2	easy	42	\N	approved	\N	\N	2026-08-03 16:23:48.97	\N	\N	\N	0	0	0	2026-08-03 16:24:06.557	0	0	0	0	0	0	["concepts"]	\N	\N	\N
386	What is a 51% attack?	When one party controls a majority of hash power and can reorder recent history	When 51% of users sell at once	When fees rise above half the transaction value	When half the nodes go offline	1	hard	42	\N	approved	\N	\N	2026-08-03 16:23:48.975	\N	\N	\N	0	0	0	2026-08-03 16:24:06.563	0	0	0	0	0	0	["security"]	\N	\N	\N
387	Why is 'not your keys, not your coins' a common warning?	Custodial services hold the keys, so you depend on them to honour your balance	Keys expire after a set period	Coins lose value in a wallet	Exchanges charge more than wallets	1	medium	42	\N	approved	\N	\N	2026-08-03 16:23:48.98	\N	\N	\N	0	0	0	2026-08-03 16:24:06.568	0	0	0	0	0	0	["custody","security"]	\N	\N	\N
388	What is a transaction fee for?	Paying the network's operators for including and securing your transaction	A government tax	Insurance against loss	Buying the token itself	1	easy	42	\N	approved	\N	\N	2026-08-03 16:23:48.985	\N	\N	\N	0	0	0	2026-08-03 16:24:06.574	0	0	0	0	0	0	["fees"]	\N	\N	\N
389	What does 'finality' mean in a blockchain context?	The point at which a transaction is considered irreversible	The last block ever produced	The end of a mining epoch	When a wallet is closed	1	hard	42	\N	approved	\N	\N	2026-08-03 16:23:48.99	\N	\N	\N	0	0	0	2026-08-03 16:24:06.58	0	0	0	0	0	0	["concepts"]	\N	\N	\N
154	In The Lord of the Rings, what is the name of Frodo's sword?	Excalibur	Sting	Durandal	Anduril	2	medium	26	\N	archived	\N	\N	2026-06-26 11:27:52.159	\N	\N	\N	0	0	0	2026-06-26 11:27:52.159	0	0	0	0	0	0	["Literature","Fantasy"]	\N	\N	\N
155	Who is the author of the Foundation series?	Arthur C. Clarke	Isaac Asimov	Philip K. Dick	Douglas Adams	2	medium	26	\N	archived	\N	\N	2026-06-26 11:27:52.162	\N	\N	\N	0	0	0	2026-06-26 11:27:52.161	0	0	0	0	0	0	["Science Fiction","Literature"]	\N	\N	\N
156	In Dune, what is the spice called that extends life and enables space travel?	Melange	Sandworm	Arrakis	Thumper	1	medium	26	\N	archived	\N	\N	2026-06-26 11:27:52.164	\N	\N	\N	0	0	0	2026-06-26 11:27:52.163	0	0	0	0	0	0	["Science Fiction","Literature"]	\N	\N	\N
157	What year was the first Avengers movie released?	2010	2011	2012	2013	3	easy	27	\N	archived	\N	\N	2026-06-26 11:27:52.166	\N	\N	\N	0	0	0	2026-06-26 11:27:52.165	0	0	0	0	0	0	["Marvel","Movies"]	\N	\N	\N
158	Who directed the original Blade Runner?	George Lucas	Ridley Scott	James Cameron	Stanley Kubrick	2	medium	27	\N	archived	\N	\N	2026-06-26 11:27:52.168	\N	\N	\N	0	0	0	2026-06-26 11:27:52.167	0	0	0	0	0	0	["Sci-Fi","Movies"]	\N	\N	\N
159	In Breaking Bad, what alias does Walter White use?	Cook	Heisenberg	Mr. White	Cap'n Cook	2	easy	27	\N	archived	\N	\N	2026-06-26 11:27:52.17	\N	\N	\N	0	0	0	2026-06-26 11:27:52.169	0	0	0	0	0	0	["TV","Drama"]	\N	\N	\N
160	How many seasons did Game of Thrones run for?	6	7	8	9	3	easy	27	\N	archived	\N	\N	2026-06-26 11:27:52.172	\N	\N	\N	0	0	0	2026-06-26 11:27:52.171	0	0	0	0	0	0	["TV","Fantasy"]	\N	\N	\N
161	Who played the Joker in The Dark Knight?	Jared Leto	Heath Ledger	Joaquin Phoenix	Jack Nicholson	2	easy	27	\N	archived	\N	\N	2026-06-26 11:27:52.175	\N	\N	\N	0	0	0	2026-06-26 11:27:52.174	0	0	0	0	0	0	["Movies","Comic Book"]	\N	\N	\N
162	What is the name of the coffee shop in Friends?	Grind House	Coffee Central	Central Perk	The Daily Grind	3	easy	27	\N	archived	\N	\N	2026-06-26 11:27:52.178	\N	\N	\N	0	0	0	2026-06-26 11:27:52.178	0	0	0	0	0	0	["TV","Comedy"]	\N	\N	\N
163	Who created Spider-Man?	Jack Kirby	Stan Lee and Steve Ditko	Todd McFarlane	George Lucas	2	medium	28	\N	archived	\N	\N	2026-06-26 11:27:52.181	\N	\N	\N	0	0	0	2026-06-26 11:27:52.18	0	0	0	0	0	0	["Marvel","Comics"]	\N	\N	\N
164	What is Batman's real name?	Bruce Wayne	Clark Kent	Peter Parker	Tony Stark	1	easy	28	\N	archived	\N	\N	2026-06-26 11:27:52.185	\N	\N	\N	0	0	0	2026-06-26 11:27:52.184	0	0	0	0	0	0	["DC","Comics"]	\N	\N	\N
165	What colour is the Incredible Hulk?	Blue	Green	Purple	Red	2	easy	28	\N	archived	\N	\N	2026-06-26 11:27:52.187	\N	\N	\N	0	0	0	2026-06-26 11:27:52.186	0	0	0	0	0	0	["Marvel","Comics"]	\N	\N	\N
166	Who is Superman's archnemesis?	Joker	Lex Luthor	Green Goblin	Magneto	2	easy	28	\N	archived	\N	\N	2026-06-26 11:27:52.19	\N	\N	\N	0	0	0	2026-06-26 11:27:52.189	0	0	0	0	0	0	["DC","Comics"]	\N	\N	\N
167	What is the real name of the Flash (Barry Allen's superhero name)?	Speed Force	Scarlet Speedster	The Flash	Lightning Rod	3	medium	28	\N	archived	\N	\N	2026-06-26 11:27:52.193	\N	\N	\N	0	0	0	2026-06-26 11:27:52.192	0	0	0	0	0	0	["DC","Comics"]	\N	\N	\N
168	Which X-Men member can control magnetism?	Wolverine	Magneto	Storm	Cyclops	2	easy	28	\N	archived	\N	\N	2026-06-26 11:27:52.195	\N	\N	\N	0	0	0	2026-06-26 11:27:52.195	0	0	0	0	0	0	["Marvel","Comics"]	\N	\N	\N
169	What is the main character's name in Naruto?	Sasuke Uchiha	Kakashi Hatake	Naruto Uzumaki	Jiraiya	3	easy	29	\N	archived	\N	\N	2026-06-26 11:27:52.198	\N	\N	\N	0	0	0	2026-06-26 11:27:52.197	0	0	0	0	0	0	["Anime","Manga"]	\N	\N	\N
170	In Attack on Titan, what creatures do the humans fight?	Demons	Titans	Dragons	Monsters	2	easy	29	\N	archived	\N	\N	2026-06-26 11:27:52.2	\N	\N	\N	0	0	0	2026-06-26 11:27:52.2	0	0	0	0	0	0	["Anime","Action"]	\N	\N	\N
171	What is the protagonist's goal in One Piece?	Become a Samurai	Find the One Piece treasure	Save the World	Defeat Luffy	2	easy	29	\N	archived	\N	\N	2026-06-26 11:27:52.202	\N	\N	\N	0	0	0	2026-06-26 11:27:52.202	0	0	0	0	0	0	["Anime","Adventure"]	\N	\N	\N
172	Who is the main antagonist in Code Geass?	Shirley Fenette	CC	Lelouch vi Britannia	Suzaku Kururugi	3	hard	29	\N	archived	\N	\N	2026-06-26 11:27:52.205	\N	\N	\N	0	0	0	2026-06-26 11:27:52.204	0	0	0	0	0	0	["Anime","Drama"]	\N	\N	\N
173	In Demon Slayer, what type of power do the slayers use?	Magic	Breathing Techniques	Chi Energy	Chakra	2	medium	29	\N	archived	\N	\N	2026-06-26 11:27:52.207	\N	\N	\N	0	0	0	2026-06-26 11:27:52.207	0	0	0	0	0	0	["Anime","Action"]	\N	\N	\N
174	What is the name of Goku's signature technique in Dragon Ball?	Spirit Bomb	Kamehameha	Destructo Disc	Galick Gun	2	easy	29	\N	archived	\N	\N	2026-06-26 11:27:52.21	\N	\N	\N	0	0	0	2026-06-26 11:27:52.209	0	0	0	0	0	0	["Anime","Action"]	\N	\N	\N
175	What year was Python created?	1989	1991	1995	2000	2	hard	30	\N	archived	\N	\N	2026-06-26 11:27:52.212	\N	\N	\N	0	0	0	2026-06-26 11:27:52.211	0	0	0	0	0	0	["Programming","Languages"]	\N	\N	\N
176	Who invented the World Wide Web?	Bill Gates	Steve Jobs	Tim Berners-Lee	Linus Torvalds	3	medium	30	\N	archived	\N	\N	2026-06-26 11:27:52.214	\N	\N	\N	0	0	0	2026-06-26 11:27:52.213	0	0	0	0	0	0	["Tech History","Web"]	\N	\N	\N
177	What does HTML stand for?	Hyper Text Markup Language	High Tech Modern Language	Home Tool Markup Language	Hyperlinks and Text Markup Language	1	easy	30	\N	archived	\N	\N	2026-06-26 11:27:52.216	\N	\N	\N	0	0	0	2026-06-26 11:27:52.216	0	0	0	0	0	0	["Web","Programming"]	\N	\N	\N
178	Which company developed JavaScript?	Microsoft	Oracle	Netscape	Google	3	medium	30	\N	archived	\N	\N	2026-06-26 11:27:52.22	\N	\N	\N	0	0	0	2026-06-26 11:27:52.219	0	0	0	0	0	0	["Programming","Web"]	\N	\N	\N
179	What does SQL stand for?	Structured Query Language	Sequential Query Language	Simple Query Language	Standard Query Language	1	easy	30	\N	archived	\N	\N	2026-06-26 11:27:52.222	\N	\N	\N	0	0	0	2026-06-26 11:27:52.221	0	0	0	0	0	0	["Databases","Programming"]	\N	\N	\N
180	In cryptography, what does RSA stand for?	Rivest-Shamir-Adleman	Run-System-Algorithm	Rapid-Secure-Access	Real-System-Architecture	1	hard	30	\N	archived	\N	\N	2026-06-26 11:27:52.225	\N	\N	\N	0	0	0	2026-06-26 11:27:52.224	0	0	0	0	0	0	["Cryptography","Security"]	\N	\N	\N
181	In what year did World War II end?	1943	1944	1945	1946	3	easy	31	\N	archived	\N	\N	2026-06-26 11:27:52.228	\N	\N	\N	0	0	0	2026-06-26 11:27:52.227	0	0	0	0	0	0	["World History","War"]	\N	\N	\N
182	Who was the first President of the United States?	Thomas Jefferson	George Washington	Benjamin Franklin	John Adams	2	easy	31	\N	archived	\N	\N	2026-06-26 11:27:52.231	\N	\N	\N	0	0	0	2026-06-26 11:27:52.23	0	0	0	0	0	0	["USA History","Presidents"]	\N	\N	\N
183	In what year did the Berlin Wall fall?	1987	1988	1989	1990	3	medium	31	\N	archived	\N	\N	2026-06-26 11:27:52.233	\N	\N	\N	0	0	0	2026-06-26 11:27:52.232	0	0	0	0	0	0	["Modern History","Cold War"]	\N	\N	\N
184	Which empire built the Great Wall of China?	Han Dynasty	Ming Dynasty	Qin Dynasty	Tang Dynasty	2	medium	31	\N	archived	\N	\N	2026-06-26 11:27:52.236	\N	\N	\N	0	0	0	2026-06-26 11:27:52.235	0	0	0	0	0	0	["Asian History","Architecture"]	\N	\N	\N
185	Who was Napoleon Bonaparte?	King of France	Emperor of France	General of Rome	Duke of Spain	2	easy	31	\N	archived	\N	\N	2026-06-26 11:27:52.238	\N	\N	\N	0	0	0	2026-06-26 11:27:52.237	0	0	0	0	0	0	["European History","Military"]	\N	\N	\N
186	In what year did the Titanic sink?	1910	1911	1912	1913	3	easy	31	\N	archived	\N	\N	2026-06-26 11:27:52.241	\N	\N	\N	0	0	0	2026-06-26 11:27:52.241	0	0	0	0	0	0	["Maritime History","Disasters"]	\N	\N	\N
187	What year did the first iPhone release?	2005	2006	2007	2008	3	easy	32	\N	archived	\N	\N	2026-06-26 11:27:52.244	\N	\N	\N	0	0	0	2026-06-26 11:27:52.243	0	0	0	0	0	0	["Tech","Apple"]	\N	\N	\N
188	Who is the creator of South Park?	Trey Parker and Matt Stone	Dan Harmon	Seth MacFarlane	Mike Judge	1	medium	32	\N	archived	\N	\N	2026-06-26 11:27:52.246	\N	\N	\N	0	0	0	2026-06-26 11:27:52.245	0	0	0	0	0	0	["Television","Comedy"]	\N	\N	\N
189	What is the most streamed song on Spotify of all time?	Blinding Lights	Shape of You	Someone You Loved	Bad Guy	1	hard	32	\N	archived	\N	\N	2026-06-26 11:27:52.248	\N	\N	\N	0	0	0	2026-06-26 11:27:52.247	0	0	0	0	0	0	["Music","Streaming"]	\N	\N	\N
190	Which social media platform was founded by Mark Zuckerberg?	Twitter	Instagram	Facebook	TikTok	3	easy	32	\N	archived	\N	\N	2026-06-26 11:27:52.251	\N	\N	\N	0	0	0	2026-06-26 11:27:52.25	0	0	0	0	0	0	["Social Media","Tech"]	\N	\N	\N
191	What is the name of Taylor Swift's most recent album (as of 2024)?	Folklore	Evermore	Midnights	The Tortured Poets Department	4	hard	32	\N	archived	\N	\N	2026-06-26 11:27:52.253	\N	\N	\N	0	0	0	2026-06-26 11:27:52.252	0	0	0	0	0	0	["Music","Pop"]	\N	\N	\N
192	Which actor played Tony Stark in the Marvel Cinematic Universe?	Robert Downey Jr.	Chris Evans	Chris Hemsworth	Scarlett Johansson	1	easy	32	\N	archived	\N	\N	2026-06-26 11:27:52.256	\N	\N	\N	0	0	0	2026-06-26 11:27:52.255	0	0	0	0	0	0	["Movies","Marvel"]	\N	\N	\N
145	What year was the first Super Mario Bros. released?	1983	1985	1987	1989	2	medium	25	\N	archived	\N	\N	2026-06-26 11:27:52.131	\N	\N	\N	0	0	0	2026-06-26 11:27:52.13	0	0	0	0	0	0	["Nintendo","Platform"]	\N	\N	\N
146	Which company developed The Witcher 3?	Bethesda	CD Projekt Red	FromSoftware	Rockstar Games	2	easy	25	\N	archived	\N	\N	2026-06-26 11:27:52.136	\N	\N	\N	0	0	0	2026-06-26 11:27:52.135	0	0	0	0	0	0	["RPG","2010s"]	\N	\N	\N
147	What is the name of the AI companion in Half-Life 2?	GLADOS	HEV	Alyx Vance	The G-Man	3	medium	25	\N	archived	\N	\N	2026-06-26 11:27:52.139	\N	\N	\N	0	0	0	2026-06-26 11:27:52.138	0	0	0	0	0	0	["FPS","Valve"]	\N	\N	\N
148	Which Dark Souls game was developed by FromSoftware and published in 2011?	Dark Souls II	Dark Souls	Dark Souls III	Elden Ring	2	easy	25	\N	archived	\N	\N	2026-06-26 11:27:52.143	\N	\N	\N	0	0	0	2026-06-26 11:27:52.142	0	0	0	0	0	0	["FromSoftware","Action RPG"]	\N	\N	\N
193	Which studio developed Elden Ring?	FromSoftware	Bethesda	CD Projekt Red	Naughty Dog	1	easy	25	1	archived	1	\N	2026-07-16 15:41:19.102	\N	\N	Elden Ring's world was co-written with fantasy author George R. R. Martin.	0	0	0	2026-07-16 15:41:19.099	0	0	0	0	0	0	["RPG","2020s"]	2022	\N	\N
194	In 'Dune', what is the name of the giant sandworms' home planet?	Arrakis	Caladan	Giedi Prime	Kaitain	1	medium	26	1	archived	1	\N	2026-07-16 15:41:19.102	\N	\N	\N	0	0	0	2026-07-16 15:41:19.099	0	0	0	0	0	0	["Dune","Books"]	\N	\N	\N
195	What does the acronym 'API' stand for?	Application Programming Interface	Automated Program Integration	Application Process Instruction	Advanced Programming Index	1	easy	30	1	archived	1	\N	2026-07-16 15:41:19.102	\N	\N	\N	0	0	0	2026-07-16 15:41:19.099	0	0	0	0	0	0	["Basics"]	\N	\N	\N
196	Valid one?	A	B	C	D	2	easy	25	1	archived	1	\N	2026-07-16 15:41:57.546	\N	\N	\N	0	0	0	2026-07-16 15:41:57.544	0	0	0	0	0	0	[]	\N	\N	\N
336	What does Kaspa do with blocks that are mined in parallel?	Discards all but the longest chain	Includes them all in the DAG and orders them by consensus	Stores them off-chain for later	Refunds the miners and deletes them	2	medium	36	\N	approved	\N	\N	2026-08-03 16:23:48.694	\N	\N	No honest work is thrown away — this is the core idea that lets Kaspa raise block rates safely.	0	0	0	2026-08-03 16:24:06.292	0	0	0	0	0	0	["ghostdag"]	\N	\N	\N
353	What is distinctive about Kaspa's 'chromatic halving' emission schedule?	Rewards halve abruptly every four years	Rewards decrease smoothly every month, halving over the course of a year	Rewards increase over time	Rewards are fixed forever	2	hard	38	\N	approved	\N	\N	2026-08-03 16:23:48.806	\N	\N	Each month the reward is multiplied by the twelfth root of one half, so a full halving takes a year without a sudden cliff.	0	0	0	2026-08-03 16:24:06.387	0	0	0	0	0	0	["emission","halving"]	\N	\N	\N
357	What happens to a Kaspa miner's block reward over time?	It grows with network usage	It shrinks on a predetermined schedule	It stays constant forever	It is decided by miners each month	2	easy	38	\N	approved	\N	\N	2026-08-03 16:23:48.828	\N	\N	\N	0	0	0	2026-08-03 16:24:06.409	0	0	0	0	0	0	["emission"]	\N	\N	\N
362	If you lose your wallet's seed phrase and have no backup, what happens to your funds?	Support can restore them with ID verification	They are permanently inaccessible	They return to the treasury after a year	Miners can recover them for a fee	2	easy	39	\N	approved	\N	\N	2026-08-03 16:23:48.854	\N	\N	No one can reissue your keys. Self-custody means the backup is genuinely your job.	0	0	0	2026-08-03 16:24:06.436	0	0	0	0	0	0	["security","custody"]	\N	\N	\N
\.


--
-- Data for Name: quiz_attempts; Type: TABLE DATA; Schema: public; Owner: geek
--

COPY public.quiz_attempts (id, "attemptId", "userId", "attemptToken", round, "correctCount", score, "rewardAmount", status, "createdAt") FROM stdin;
1	daily_1784662575483_e8i51g	10	eyJhdHRlbXB0SWQiOiJkYWlseV8xNzg0NjYyNTc1NDgzX2U4aTUxZyIsInF1ZXN0aW9uSWRzIjoiWzE2MiwxODcsMTYxLDE1NiwxNjMsMTQ5LDE4NiwxODksMTU0LDE1MV0iLCJjb3JyZWN0QW5zd2VycyI6IlswLDMsMCwwLDEsMCwxLDMsMCwwXSIsImV4cCI6MTc4NDY2NDM3NX0=.8e61dac29ef07400dcfba2763689e1c9e5aadaa18314826fea356a1661372f00	0	1	17	0.50000000	pending	2026-07-21 19:36:31.892
93	daily_1786628024884_esw7eg	2	eyJhdHRlbXB0SWQiOiJkYWlseV8xNzg2NjI4MDI0ODg0X2VzdzdlZyIsInF1ZXN0aW9uSWRzIjoiWzM1NSwzMzksMzUxLDMzMiwzNzEsMzQ0LDM2OCwzNTcsMzQ4LDM0OV0iLCJjb3JyZWN0QW5zd2VycyI6IlsxLDIsMywwLDIsMiwxLDMsMSwxXSIsImlhdCI6MTc4NjYyODAyNDg4NCwiZXhwIjoxNzg2NjI5ODI0fQ==.2f1ce8f5e1b5f8d7bd0c53246d71d81f8816b13e29a0e0f7278875d8f14a9bed	0	2	22	1.00000000	pending	2026-08-13 13:34:50.242
52	daily_1785440231904_5k9lpj	2	eyJhdHRlbXB0SWQiOiJkYWlseV8xNzg1NDQwMjMxOTA0XzVrOWxwaiIsInF1ZXN0aW9uSWRzIjoiWzE4MywxOTMsMTQ5LDE3OSwxNzYsMTQ1LDE4OCwxNjYsMTQ2LDE4OV0iLCJjb3JyZWN0QW5zd2VycyI6IlsyLDIsMywzLDEsMSwwLDMsMywwXSIsImlhdCI6MTc4NTQ0MDIzMTkwNCwiZXhwIjoxNzg1NDQyMDMxfQ==.bf1d5d7e71c4d95062c706513738ce60deeaf290be37587c000613ee4da2e625	0	1	11	0.50000000	paid	2026-07-30 19:44:14.808
\.


--
-- Data for Name: review_queue; Type: TABLE DATA; Schema: public; Owner: geek
--

COPY public.review_queue (id, "questionId", "dateAdded", priority, "lastShown") FROM stdin;
\.


--
-- Data for Name: rewards; Type: TABLE DATA; Schema: public; Owner: geek
--

COPY public.rewards (id, "userId", amount, "attemptId", "confirmedAt", "createdAt", error, status, txid) FROM stdin;
1	2	0.50000000	daily_1785440231904_5k9lpj	2026-07-30 19:51:30.464	2026-07-30 19:51:30.457	\N	confirmed	\N
\.


--
-- Data for Name: series_completions; Type: TABLE DATA; Schema: public; Owner: geek
--

COPY public.series_completions (id, "userId", "seriesId", "dateCompleted") FROM stdin;
\.


--
-- Data for Name: sticker_packs; Type: TABLE DATA; Schema: public; Owner: geek
--

COPY public.sticker_packs (id, "userId", "packType", "seriesId", "stickersPerPack", "guaranteedRarity", source, "sourceDetail", "createdAt", "openedAt", "isOpened") FROM stdin;
\.


--
-- Data for Name: sticker_purchase_transactions; Type: TABLE DATA; Schema: public; Owner: geek
--

COPY public.sticker_purchase_transactions (id, "buyerId", "stickerId", "priceGeek", "wasDuplicate", "dustAwarded", source, "createdAt") FROM stdin;
\.


--
-- Data for Name: sticker_series; Type: TABLE DATA; Schema: public; Owner: geek
--

COPY public.sticker_series (id, name, description, "totalStickers", "isActive") FROM stdin;
\.


--
-- Data for Name: stickers; Type: TABLE DATA; Schema: public; Owner: geek
--

COPY public.stickers (id, "seriesId", name, image, rarity, number) FROM stdin;
\.


--
-- Data for Name: topics; Type: TABLE DATA; Schema: public; Owner: geek
--

COPY public.topics (id, name, description, icon, "isActive", "dateCreated") FROM stdin;
25	Video Games	Video Games related questions	\N	f	2026-06-26 11:27:52.106
26	Sci-Fi & Fantasy	Sci-Fi & Fantasy related questions	\N	f	2026-06-26 11:27:52.114
27	Movies & TV	Movies & TV related questions	\N	f	2026-06-26 11:27:52.117
28	Comics	Comics related questions	\N	f	2026-06-26 11:27:52.118
29	Anime & Manga	Anime & Manga related questions	\N	f	2026-06-26 11:27:52.121
30	Tech & Programming	Tech & Programming related questions	\N	f	2026-06-26 11:27:52.123
31	History	History related questions	\N	f	2026-06-26 11:27:52.126
32	Pop Culture	Pop Culture related questions	\N	f	2026-06-26 11:27:52.128
35	Kaspa Origins	The people, papers and decisions behind Kaspa's fair launch.	📜	t	2026-08-03 16:23:48.583
36	GHOSTDAG & BlockDAG	How Kaspa orders parallel blocks instead of throwing them away.	🕸️	t	2026-08-03 16:23:48.605
37	Mining & Consensus	Proof of work, kHeavyHash, block rates and security.	⛏️	t	2026-08-03 16:23:48.608
38	Tokenomics	Supply, emission and the halving that happens every month.	🪙	t	2026-08-03 16:23:48.611
39	Wallets & Addresses	Keys, addresses, UTXOs and keeping your KAS safe.	🔑	t	2026-08-03 16:23:48.615
40	KRC-20 & Smart Contracts	Tokens, inscriptions and the programmable layer.	📦	t	2026-08-03 16:23:48.618
41	Kaspa Ecosystem	Explorers, wallets, tooling and the projects being built.	🌐	t	2026-08-03 16:23:48.621
42	Crypto Fundamentals	The core ideas every Kaspa user should understand.	🧠	t	2026-08-03 16:23:48.625
\.


--
-- Data for Name: treasury_ledger; Type: TABLE DATA; Schema: public; Owner: geek
--

COPY public.treasury_ledger (id, amount, reason, recipient, "triggeringId", "createdAt") FROM stdin;
1	-0.50000000	quiz_reward		daily_1785440231904_5k9lpj	2026-07-30 19:51:30.466
\.


--
-- Data for Name: user_achievements; Type: TABLE DATA; Schema: public; Owner: geek
--

COPY public.user_achievements (id, "userId", "achievementId", "dateUnlocked", "tierReached", "wasHidden", "notificationShown") FROM stdin;
\.


--
-- Data for Name: user_notifications; Type: TABLE DATA; Schema: public; Owner: geek
--

COPY public.user_notifications (id, "userId", title, message, category, "isRead", "createdAt") FROM stdin;
\.


--
-- Data for Name: user_stickers; Type: TABLE DATA; Schema: public; Owner: geek
--

COPY public.user_stickers (id, "userId", "stickerId", "isDuplicate", "dateAcquired") FROM stdin;
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: geek
--

COPY public.users (id, username, email, "passwordHash", "walletAddress", points, "geekBalance", xp, level, "currentStreak", "longestStreak", "lastLoginDate", "streakMilestoneRewards", role, "isAdmin", "dateCreated", "reputationScore", "totalEarnedGeek", "questionsSubmitted", "questionsApproved", "questionsRejected", "reviewsCompleted", "reviewAccuracy", "streakBonusMultiplier", "favoriteCharacter", "characterAffinityGiga", "characterAffinityAce", "lastCharacterInteraction", "preferredDifficulty", "averageResponseTime", "categoryAccuracies", "learningStyle", "wordChallengeWins", "wordChallengeLosses", "wordChallengeHighScore", "wordChallengeTotalScore", "wordChallengeBingos", "aiInteractionCount", "lastAiRecommendation", "characterInteractionHistory", "wordChallengeDraws", "wordChallengeLongestWord", "wordChallengeFavoriteLetter", "encryptedPrivKey", "kycVerified") FROM stdin;
1	testgeek	test@geek.xyz	$2b$12$.8W71aYVhAjDfQVfmHnkvuWtiYdq4r6Jmmnov7ndWgjNGCNRisTii	\N	0	0.00000000	0	1	1	1	2026-06-16 12:51:55.096	[]	admin	t	2026-06-16 12:51:45.723	100	0.00000000	0	0	0	0	0	1.1	GIGA	50	50	\N	mixed	15	{}	balanced	0	0	0	0	0	0	\N	[]	0	\N	\N	\N	f
3	ceej	omolafejoshua225@gmail.com	$2b$12$4D/v5Plbnof7/6aMu8pe3O4MR0ryXgpqhHkXwf1rsA/pxcBLX7KaK	\N	45	1.50000000	33	1	1	1	2026-06-30 10:31:49.815	[]	player	f	2026-06-30 10:31:48.875	100	0.00000000	0	0	0	0	0	1.1	GIGA	50	50	\N	mixed	15	{}	balanced	0	0	0	0	0	0	\N	[]	0	\N	\N	\N	f
4	kaspa_00000000	00000000@wallet.geekprotocol.local	$2b$12$XWBDW6qxbud18YWIFY19kukJWDWoqBFspCth/y6/p5vL3Ue.0MI5y	kaspatest:qztestaddress0000000000000000000000000000000000000000000	0	0.00000000	0	1	1	1	2026-07-14 22:18:38.341	[]	player	f	2026-07-14 22:18:38.33	100	0.00000000	0	0	0	0	0	1.1	GIGA	50	50	\N	mixed	15	{}	balanced	0	0	0	0	0	0	\N	[]	0	\N	\N	\N	f
68	prod_1785497607642	prod_1785497607642@t.local	$2b$12$9xQcCv2FuMlnGPuJUGUREONgoTFOOQ6OqnJkgYzEfPCZpsZu.vH1e	kaspa:qruvrpvkqh3fzzgrmjwtaw99prswa2whyw0qlm2j40600mjyj40pvarzpg5qa	0	0.00000000	0	1	0	0	\N	[]	player	f	2026-07-31 11:33:28.324	100	0.00000000	0	0	0	0	0	1	GIGA	50	50	\N	mixed	15	{}	balanced	0	0	0	0	0	0	\N	[]	0	\N	\N	b38395c67daece1eaf88db162a6d6f63:4c8258e7c5fa0ae9f84d5b7674dcf6834b5adc93c9324ff01f371041556b201dc5b857d34dfc487ec423a5c1e4b0955eefe5c8c9699fbf41b803ab6b4be04c11c5914dbfae90439403b6092e180231e9	f
7	kaspa_67864272	67864272@wallet.geekprotocol.local	$2b$12$IWDXKpgRuCNfATWoiiEROOQ1ThDXtgJAtXNgM70xU3xy8f3JwQxX6	kaspatest:qzmockplaywrightaddressabc123def4561784067864272	0	0.00000000	0	1	1	1	2026-07-14 22:24:26.566	[]	player	f	2026-07-14 22:24:26.553	100	0.00000000	0	0	0	0	0	1.1	GIGA	50	50	\N	mixed	15	{}	balanced	0	0	0	0	0	0	\N	[]	0	\N	\N	\N	f
8	kaspa_68278112	68278112@wallet.geekprotocol.local	$2b$12$iIlrvJ4Yx4q2PQza5f9ose8sKoKBoo9PEru5WJmQ8vIxUp1SVwciK	kaspatest:qzmockplaywrightaddressabc123def4561784068278112	0	0.00000000	0	1	1	1	2026-07-14 22:31:20.472	[]	player	f	2026-07-14 22:31:20.459	100	0.00000000	0	0	0	0	0	1.1	GIGA	50	50	\N	mixed	15	{}	balanced	0	0	0	0	0	0	\N	[]	0	\N	\N	\N	f
9	kaspa_68352677	68352677@wallet.geekprotocol.local	$2b$12$fXoFMEBdnP2BPZuUjxi3/.7j6yKQ2vel6e8TWhrESDVtyaZJeM2aW	kaspatest:qzprofilecheck1784068352677	0	0.00000000	0	1	1	1	2026-07-14 22:32:35.123	[]	player	f	2026-07-14 22:32:35.117	100	0.00000000	0	0	0	0	0	1.1	GIGA	50	50	\N	mixed	15	{}	balanced	0	0	0	0	0	0	\N	[]	0	\N	\N	\N	f
69	kaspa_3p0czse3	3p0czse3@wallet.geekprotocol.local	$2b$12$pStD9I3rO.bOXwrto9br7.EssWjCK7YQK733v61KnuW83MuKksbri	kaspa:qp3q2r5euc7fhx78exvnvxqepth8pwqu0xk7nxnnj600hy0j5jlmj3p0czse3	0	0.00000000	0	1	1	1	2026-07-31 11:33:29.031	[]	player	f	2026-07-31 11:33:29.011	100	0.00000000	0	0	0	0	0	1.1	GIGA	50	50	\N	mixed	15	{}	balanced	0	0	0	0	0	0	\N	[]	0	\N	\N	\N	f
70	g_1785774932673	g_1785774932673@t.local	$2b$12$acYsYU4XFg04jTseNhsr9OhpHdSouFYB5h7sylnxs31aK6DUjOdxa	kaspa:qpdjd0x6q6y3hluggqd3c9enthxezs2045qnczwu8csuv3y8a5alxfyaqnt8v	0	0.00000000	0	1	0	0	\N	[]	player	f	2026-08-03 16:35:35.398	100	0.00000000	0	0	0	0	0	1	GIGA	50	50	\N	mixed	15	{}	balanced	0	0	0	0	0	0	\N	[]	0	\N	\N	c5d50a13eb711dbe0b3e64a748107d24:6b04d70849815c0a5dab350093360fa4ac7078328e0a004b81f67aa60a15d763e7a672b55afef07af8e8206d0d19249c7a2f1897ddc5f503060e3fbd842fb6d3eb3d20e1f065c84c391d1fa01cef955a	f
71	g_1785774952643	g_1785774952643@t.local	$2b$12$DBjuUiZeZnv8ov8HLO14YufCKIjcPxMYWbYm.7jOZHkfb12wO3Y7a	kaspa:qpduuvxw4mlffy0ljg3ks333f2anh6xfj9dt2xp5ekn338vpcy6k2xj8hmhtk	0	0.00000000	0	1	0	0	\N	[]	player	f	2026-08-03 16:35:54.158	100	0.00000000	0	0	0	0	0	1	GIGA	50	50	\N	mixed	15	{}	balanced	0	0	0	0	0	0	\N	[]	0	\N	\N	cc6e03036a7205a383ba0b2a050f7ad5:c890a428e52f0c2c0a2c5a899c687bc4ff99f98e743f2921a53b1acdb0a42b2e08fc415f0045160592fa18160d717a2fe7cb073e75cf368d40b55f99f141f1059c2cb9e68dec78cab5f05e15b3e07bbd	f
72	g_1785774973680	g_1785774973680@t.local	$2b$12$clkyivJyQBPNnJhj8Ltn4uS1dY4WfKMV8rqggJNoIrlC8nk6YeZs2	kaspa:qp0kjc0dtyzc9cgaczvc04ee0rk8gx0nqewlhhkk2tpchtcj5l80ul0wfl8a2	0	0.00000000	0	1	0	0	\N	[]	player	f	2026-08-03 16:36:15.181	100	0.00000000	0	0	0	0	0	1	GIGA	50	50	\N	mixed	15	{}	balanced	0	0	0	0	0	0	\N	[]	0	\N	\N	3c2f81d553aed342f236fdd6100ff54d:040f8e3cf2661c834ebc27d16af69aedb2eae8f259013078ec45c43726e69ed9ee70b775928777c7c75b484a5e4bf3494928befcef794f41c89a486395449cab29ce91c320cc523820b33b6658841040	f
73	g2_1785775293869	g2_1785775293869@t.local	$2b$12$KwvNTVCN72JNSQ/EPj4tEu5Mxk7w940YLFaP46t71JLHGh9WqoPza	kaspa:qzmn2srpz6rkepv4c4j2sgw9lw05f3gzhjk6n60r2z8zyujl7ezlvazmas7r3	0	0.00000000	30	1	0	0	\N	[]	player	f	2026-08-03 16:41:35.093	100	0.00000000	0	0	0	0	0	1	GIGA	50	50	\N	mixed	15	{}	balanced	0	0	0	0	0	0	\N	[]	0	\N	\N	2529e1e3c2f07d86de888fca19e3fc48:4362c175767076656afe51fe1e9fd6b612a786af1a4af30f66023fbb02f469d560a03e896c774432e0a60b4c427f63762d3798ae26e5ba94ea0731240cb8367a0c7a17151a66d909796d3d61f6164348	f
10	geek	geek@geekprotocol.local	$2b$12$eHWj1WTc1ZyG6OoCVJaVveO/Wxi0j25BcUshXFo7xAXU1uEc.mgWS	\N	0	7.14000000	120	1	1	1	2026-07-16 16:52:34.579	[]	admin	t	2026-07-16 15:46:58.824	100	0.00000000	0	0	0	0	0	1.1	GIGA	50	50	\N	mixed	15	{}	balanced	0	0	0	0	0	0	\N	[]	0	\N	\N	\N	f
74	ceejayq	omolafejoshua253@gmail.com	$2b$12$3M4fvwKcW8uF8e3x8off3e78K0faES4Mwwh0aLL1Y.NPPUcYSK1ni	kaspa:qpf4cz5d5yqrtdvqwfu3taqw57vjkmsjfp6pcdwrkwdul0fca9f05u6kkue9e	0	0.00000000	45	1	1	1	2026-08-03 16:47:14.32	[]	player	f	2026-08-03 16:47:13.536	100	0.00000000	0	0	0	0	0	1.1	GIGA	50	50	\N	mixed	15	{}	balanced	0	0	0	0	0	0	\N	[]	0	\N	\N	d5e6b8bdc6dc4e0fff8db1b28409d97c:6aecd586ed963d793bc0e36489ead5d9a425f8c33d5e16d34968232c5175d8eb3f473db6fc78490550a996e7e0a2919d5fbe241f58973846192bc97d73998f11465686537234f0ab8b1dad7b5160f1f6	f
2	ceejay	omolafejoshua25@gmail.com	$2b$12$e2kk87K18KSH55VzKA9V2uVSiEDmCCEX/KD9IAyMNc76RkdE2a23y	\N	165	367.24000000	346	1	1	1	2026-08-13 13:32:21.281	[]	player	f	2026-06-16 12:52:59.807	100	0.50000000	0	0	0	0	0	1.1	GIGA	50	50	\N	mixed	15	{}	balanced	0	0	0	0	0	0	\N	[]	0	\N	\N	\N	f
27	kaspa_0d0ce7q4	0d0ce7q4@wallet.geekprotocol.local	$2b$12$HwprGefsSfl6N3czvHkE6ejjsMEvjU8CBI50nD3BlhRtznSVunzJ.	kaspa:qrxf48dgrdkjxllxczek3uweuldtan9nma7fkjyv4zt8s7d3sap0v0d0ce7q4	0	0.00000000	0	1	1	1	2026-07-30 19:51:17.748	[]	player	f	2026-07-30 19:51:17.692	100	0.00000000	0	0	0	0	0	1.1	GIGA	50	50	\N	mixed	15	{}	balanced	0	0	0	0	0	0	\N	[]	0	\N	\N	\N	f
75	gx_1785782865133	gx_1785782865133@t.local	$2b$12$/AjgFE98BcBamCuIa9W.pu7W9EuhB7PsYF4Ylc3ferkDgdFLTnAkK	kaspa:qrg8awgfy6zzzmf690u4pl6xff8y4gz8q58me823xzu66x0e4eyszl2j050dk	0	0.00000000	0	1	1	1	2026-08-03 18:47:46.369	[]	player	f	2026-08-03 18:47:45.855	100	0.00000000	0	0	0	0	0	1.1	GIGA	50	50	\N	mixed	15	{}	balanced	0	0	0	0	0	0	\N	[]	0	\N	\N	c2c4e0a545cec458ef3c6e74db808808:ef2b2782cbb87457a3472c06d829f53e8746b635e33bfc20eabb40dbdb44f360e011a91dec0930ec1d3cdc07e36560b09cf09648f8c98df543a50ccdd07c3030bbb2728fc159ab6a055a11bde623c782	f
76	gx_1785783307308	gx_1785783307308@t.local	$2b$12$ecD5Bfgxsil6u4zr5lyf..OSjS/fr8vEBUAy5oyyPuYCRdLtUZld2	kaspa:qznc53jvy3afkft2c58mt07q2cxfga6e97auml0wjm3e9cfzx9h4z59cmv4da	0	0.00000000	45	1	1	1	2026-08-03 18:55:08.468	[]	player	f	2026-08-03 18:55:07.995	100	0.00000000	0	0	0	0	0	1.1	GIGA	50	50	\N	mixed	15	{}	balanced	0	0	0	0	0	0	\N	[]	0	\N	\N	cc8128496482b5b1b93ac4b279bedcfc:763ee3e24b54fbe1d194df7a70b6d5b412566f90deef32b5fc76f2ca46e00e34b40c405d8b37841f46a5be69598b36fc5b402059a072db25682776b95ac554c056bfb0cbfc5e4459df35dfc0f3754422	f
77	gz_1785783426335	gz_1785783426335@t.local	$2b$12$vZ9bCUKcwQ4DGXRQok3LIOiZJpACpCaFrUZokMBgDTRgP7UBTwIZS	kaspa:qq7hyqvn33upu2vg9s5sjxj0frftw8r9qgrkqnk52zunqu94uq48xgtmak9wc	0	0.00000000	75	1	1	1	2026-08-03 18:57:07.227	[]	player	f	2026-08-03 18:57:06.793	100	0.00000000	0	0	0	0	0	1.1	GIGA	50	50	\N	mixed	15	{}	balanced	0	0	0	0	0	0	\N	[]	0	\N	\N	5ad56dd0d23f9eaf9d70c25bc2b40941:cd00b7fbf560f5722f60a83469902b022587b80aa961ced161ee56911ea97ab859644b713f4a98163314002fbadaf8a2b839fb84ec55d2e2a44eb2c32116c966c6f4a0fa032a72757cc0e1c09c45b8ab	f
\.


--
-- Data for Name: withdrawals; Type: TABLE DATA; Schema: public; Owner: geek
--

COPY public.withdrawals (id, "userId", "toAddress", amount, txid, status, "createdAt") FROM stdin;
\.


--
-- Data for Name: word_challenge_chats; Type: TABLE DATA; Schema: public; Owner: geek
--

COPY public.word_challenge_chats (id, "challengeId", "userId", message, "timestamp") FROM stdin;
\.


--
-- Data for Name: word_challenge_daily_challenges; Type: TABLE DATA; Schema: public; Owner: geek
--

COPY public.word_challenge_daily_challenges (id, date, "targetScore", "targetWords", "bonusGeek", "bonusXp", description, "createdAt") FROM stdin;
\.


--
-- Data for Name: word_challenge_invites; Type: TABLE DATA; Schema: public; Owner: geek
--

COPY public.word_challenge_invites (id, "challengeId", "inviterId", "inviteeId", status, "createdAt", "expiresAt") FROM stdin;
\.


--
-- Data for Name: word_challenge_moves; Type: TABLE DATA; Schema: public; Owner: geek
--

COPY public.word_challenge_moves (id, "challengeId", "playerId", "wordPlayed", positions, score, "tilesUsed", "isBingo", "moveNumber", "timestamp") FROM stdin;
\.


--
-- Data for Name: word_challenge_players; Type: TABLE DATA; Schema: public; Owner: geek
--

COPY public.word_challenge_players (id, "challengeId", "userId", "playerNumber", score, rack, "isReady", "isTurn", "turnOrder", "joinedAt") FROM stdin;
\.


--
-- Data for Name: word_challenge_user_progress; Type: TABLE DATA; Schema: public; Owner: geek
--

COPY public.word_challenge_user_progress (id, "userId", "challengeId", "challengesPlayed", "totalScore", "totalWords", completed, "rewardClaimed", "lastUpdated") FROM stdin;
\.


--
-- Data for Name: word_challenges; Type: TABLE DATA; Schema: public; Owner: geek
--

COPY public.word_challenges (id, "challengeType", status, "boardState", "tileBag", "createdAt", "startedAt", "completedAt", "currentTurn", "turnExpiry", "winnerId", "passCount", "maxPasses") FROM stdin;
\.


--
-- Name: achievements_id_seq; Type: SEQUENCE SET; Schema: public; Owner: geek
--

SELECT pg_catalog.setval('public.achievements_id_seq', 1, false);


--
-- Name: ai_message_history_id_seq; Type: SEQUENCE SET; Schema: public; Owner: geek
--

SELECT pg_catalog.setval('public.ai_message_history_id_seq', 1, false);


--
-- Name: ai_recommendations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: geek
--

SELECT pg_catalog.setval('public.ai_recommendations_id_seq', 1, false);


--
-- Name: attempts_id_seq; Type: SEQUENCE SET; Schema: public; Owner: geek
--

SELECT pg_catalog.setval('public.attempts_id_seq', 190, true);


--
-- Name: character_interactions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: geek
--

SELECT pg_catalog.setval('public.character_interactions_id_seq', 1, false);


--
-- Name: creator_earnings_id_seq; Type: SEQUENCE SET; Schema: public; Owner: geek
--

SELECT pg_catalog.setval('public.creator_earnings_id_seq', 1, false);


--
-- Name: dust_transactions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: geek
--

SELECT pg_catalog.setval('public.dust_transactions_id_seq', 1, false);


--
-- Name: economy_config_id_seq; Type: SEQUENCE SET; Schema: public; Owner: geek
--

SELECT pg_catalog.setval('public.economy_config_id_seq', 1, false);


--
-- Name: exchange_listings_id_seq; Type: SEQUENCE SET; Schema: public; Owner: geek
--

SELECT pg_catalog.setval('public.exchange_listings_id_seq', 1, false);


--
-- Name: exchange_offers_id_seq; Type: SEQUENCE SET; Schema: public; Owner: geek
--

SELECT pg_catalog.setval('public.exchange_offers_id_seq', 1, false);


--
-- Name: exchange_transactions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: geek
--

SELECT pg_catalog.setval('public.exchange_transactions_id_seq', 1, false);


--
-- Name: gauntlet_claims_id_seq; Type: SEQUENCE SET; Schema: public; Owner: geek
--

SELECT pg_catalog.setval('public.gauntlet_claims_id_seq', 4, true);


--
-- Name: gauntlet_runs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: geek
--

SELECT pg_catalog.setval('public.gauntlet_runs_id_seq', 10, true);


--
-- Name: geek_dust_id_seq; Type: SEQUENCE SET; Schema: public; Owner: geek
--

SELECT pg_catalog.setval('public.geek_dust_id_seq', 1, false);


--
-- Name: kaspa_payments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: geek
--

SELECT pg_catalog.setval('public.kaspa_payments_id_seq', 1, false);


--
-- Name: kaspa_prices_id_seq; Type: SEQUENCE SET; Schema: public; Owner: geek
--

SELECT pg_catalog.setval('public.kaspa_prices_id_seq', 1, false);


--
-- Name: kyc_verifications_id_seq; Type: SEQUENCE SET; Schema: public; Owner: geek
--

SELECT pg_catalog.setval('public.kyc_verifications_id_seq', 1, false);


--
-- Name: points_conversion_transactions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: geek
--

SELECT pg_catalog.setval('public.points_conversion_transactions_id_seq', 1, false);


--
-- Name: purchases_id_seq; Type: SEQUENCE SET; Schema: public; Owner: geek
--

SELECT pg_catalog.setval('public.purchases_id_seq', 1, false);


--
-- Name: question_validations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: geek
--

SELECT pg_catalog.setval('public.question_validations_id_seq', 121, true);


--
-- Name: questions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: geek
--

SELECT pg_catalog.setval('public.questions_id_seq', 389, true);


--
-- Name: quiz_attempts_id_seq; Type: SEQUENCE SET; Schema: public; Owner: geek
--

SELECT pg_catalog.setval('public.quiz_attempts_id_seq', 93, true);


--
-- Name: review_queue_id_seq; Type: SEQUENCE SET; Schema: public; Owner: geek
--

SELECT pg_catalog.setval('public.review_queue_id_seq', 20, true);


--
-- Name: rewards_id_seq; Type: SEQUENCE SET; Schema: public; Owner: geek
--

SELECT pg_catalog.setval('public.rewards_id_seq', 41, true);


--
-- Name: series_completions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: geek
--

SELECT pg_catalog.setval('public.series_completions_id_seq', 1, false);


--
-- Name: sticker_packs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: geek
--

SELECT pg_catalog.setval('public.sticker_packs_id_seq', 1, false);


--
-- Name: sticker_purchase_transactions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: geek
--

SELECT pg_catalog.setval('public.sticker_purchase_transactions_id_seq', 1, false);


--
-- Name: sticker_series_id_seq; Type: SEQUENCE SET; Schema: public; Owner: geek
--

SELECT pg_catalog.setval('public.sticker_series_id_seq', 1, false);


--
-- Name: stickers_id_seq; Type: SEQUENCE SET; Schema: public; Owner: geek
--

SELECT pg_catalog.setval('public.stickers_id_seq', 1, false);


--
-- Name: topics_id_seq; Type: SEQUENCE SET; Schema: public; Owner: geek
--

SELECT pg_catalog.setval('public.topics_id_seq', 50, true);


--
-- Name: treasury_ledger_id_seq; Type: SEQUENCE SET; Schema: public; Owner: geek
--

SELECT pg_catalog.setval('public.treasury_ledger_id_seq', 41, true);


--
-- Name: user_achievements_id_seq; Type: SEQUENCE SET; Schema: public; Owner: geek
--

SELECT pg_catalog.setval('public.user_achievements_id_seq', 1, false);


--
-- Name: user_notifications_id_seq; Type: SEQUENCE SET; Schema: public; Owner: geek
--

SELECT pg_catalog.setval('public.user_notifications_id_seq', 1, false);


--
-- Name: user_stickers_id_seq; Type: SEQUENCE SET; Schema: public; Owner: geek
--

SELECT pg_catalog.setval('public.user_stickers_id_seq', 1, false);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: geek
--

SELECT pg_catalog.setval('public.users_id_seq', 77, true);


--
-- Name: withdrawals_id_seq; Type: SEQUENCE SET; Schema: public; Owner: geek
--

SELECT pg_catalog.setval('public.withdrawals_id_seq', 1, false);


--
-- Name: word_challenge_chats_id_seq; Type: SEQUENCE SET; Schema: public; Owner: geek
--

SELECT pg_catalog.setval('public.word_challenge_chats_id_seq', 1, false);


--
-- Name: word_challenge_daily_challenges_id_seq; Type: SEQUENCE SET; Schema: public; Owner: geek
--

SELECT pg_catalog.setval('public.word_challenge_daily_challenges_id_seq', 1, false);


--
-- Name: word_challenge_invites_id_seq; Type: SEQUENCE SET; Schema: public; Owner: geek
--

SELECT pg_catalog.setval('public.word_challenge_invites_id_seq', 1, false);


--
-- Name: word_challenge_moves_id_seq; Type: SEQUENCE SET; Schema: public; Owner: geek
--

SELECT pg_catalog.setval('public.word_challenge_moves_id_seq', 1, false);


--
-- Name: word_challenge_players_id_seq; Type: SEQUENCE SET; Schema: public; Owner: geek
--

SELECT pg_catalog.setval('public.word_challenge_players_id_seq', 1, false);


--
-- Name: word_challenge_user_progress_id_seq; Type: SEQUENCE SET; Schema: public; Owner: geek
--

SELECT pg_catalog.setval('public.word_challenge_user_progress_id_seq', 1, false);


--
-- Name: word_challenges_id_seq; Type: SEQUENCE SET; Schema: public; Owner: geek
--

SELECT pg_catalog.setval('public.word_challenges_id_seq', 1, false);


--
-- Name: achievements achievements_pkey; Type: CONSTRAINT; Schema: public; Owner: geek
--

ALTER TABLE ONLY public.achievements
    ADD CONSTRAINT achievements_pkey PRIMARY KEY (id);


--
-- Name: ai_message_history ai_message_history_pkey; Type: CONSTRAINT; Schema: public; Owner: geek
--

ALTER TABLE ONLY public.ai_message_history
    ADD CONSTRAINT ai_message_history_pkey PRIMARY KEY (id);


--
-- Name: ai_recommendations ai_recommendations_pkey; Type: CONSTRAINT; Schema: public; Owner: geek
--

ALTER TABLE ONLY public.ai_recommendations
    ADD CONSTRAINT ai_recommendations_pkey PRIMARY KEY (id);


--
-- Name: attempts attempts_pkey; Type: CONSTRAINT; Schema: public; Owner: geek
--

ALTER TABLE ONLY public.attempts
    ADD CONSTRAINT attempts_pkey PRIMARY KEY (id);


--
-- Name: character_interactions character_interactions_pkey; Type: CONSTRAINT; Schema: public; Owner: geek
--

ALTER TABLE ONLY public.character_interactions
    ADD CONSTRAINT character_interactions_pkey PRIMARY KEY (id);


--
-- Name: creator_earnings creator_earnings_pkey; Type: CONSTRAINT; Schema: public; Owner: geek
--

ALTER TABLE ONLY public.creator_earnings
    ADD CONSTRAINT creator_earnings_pkey PRIMARY KEY (id);


--
-- Name: dust_transactions dust_transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: geek
--

ALTER TABLE ONLY public.dust_transactions
    ADD CONSTRAINT dust_transactions_pkey PRIMARY KEY (id);


--
-- Name: economy_config economy_config_pkey; Type: CONSTRAINT; Schema: public; Owner: geek
--

ALTER TABLE ONLY public.economy_config
    ADD CONSTRAINT economy_config_pkey PRIMARY KEY (id);


--
-- Name: exchange_listings exchange_listings_pkey; Type: CONSTRAINT; Schema: public; Owner: geek
--

ALTER TABLE ONLY public.exchange_listings
    ADD CONSTRAINT exchange_listings_pkey PRIMARY KEY (id);


--
-- Name: exchange_offers exchange_offers_pkey; Type: CONSTRAINT; Schema: public; Owner: geek
--

ALTER TABLE ONLY public.exchange_offers
    ADD CONSTRAINT exchange_offers_pkey PRIMARY KEY (id);


--
-- Name: exchange_transactions exchange_transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: geek
--

ALTER TABLE ONLY public.exchange_transactions
    ADD CONSTRAINT exchange_transactions_pkey PRIMARY KEY (id);


--
-- Name: gauntlet_claims gauntlet_claims_pkey; Type: CONSTRAINT; Schema: public; Owner: geek
--

ALTER TABLE ONLY public.gauntlet_claims
    ADD CONSTRAINT gauntlet_claims_pkey PRIMARY KEY (id);


--
-- Name: gauntlet_runs gauntlet_runs_pkey; Type: CONSTRAINT; Schema: public; Owner: geek
--

ALTER TABLE ONLY public.gauntlet_runs
    ADD CONSTRAINT gauntlet_runs_pkey PRIMARY KEY (id);


--
-- Name: geek_dust geek_dust_pkey; Type: CONSTRAINT; Schema: public; Owner: geek
--

ALTER TABLE ONLY public.geek_dust
    ADD CONSTRAINT geek_dust_pkey PRIMARY KEY (id);


--
-- Name: kaspa_payments kaspa_payments_pkey; Type: CONSTRAINT; Schema: public; Owner: geek
--

ALTER TABLE ONLY public.kaspa_payments
    ADD CONSTRAINT kaspa_payments_pkey PRIMARY KEY (id);


--
-- Name: kaspa_prices kaspa_prices_pkey; Type: CONSTRAINT; Schema: public; Owner: geek
--

ALTER TABLE ONLY public.kaspa_prices
    ADD CONSTRAINT kaspa_prices_pkey PRIMARY KEY (id);


--
-- Name: kyc_verifications kyc_verifications_pkey; Type: CONSTRAINT; Schema: public; Owner: geek
--

ALTER TABLE ONLY public.kyc_verifications
    ADD CONSTRAINT kyc_verifications_pkey PRIMARY KEY (id);


--
-- Name: points_conversion_transactions points_conversion_transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: geek
--

ALTER TABLE ONLY public.points_conversion_transactions
    ADD CONSTRAINT points_conversion_transactions_pkey PRIMARY KEY (id);


--
-- Name: purchases purchases_pkey; Type: CONSTRAINT; Schema: public; Owner: geek
--

ALTER TABLE ONLY public.purchases
    ADD CONSTRAINT purchases_pkey PRIMARY KEY (id);


--
-- Name: question_validations question_validations_pkey; Type: CONSTRAINT; Schema: public; Owner: geek
--

ALTER TABLE ONLY public.question_validations
    ADD CONSTRAINT question_validations_pkey PRIMARY KEY (id);


--
-- Name: questions questions_pkey; Type: CONSTRAINT; Schema: public; Owner: geek
--

ALTER TABLE ONLY public.questions
    ADD CONSTRAINT questions_pkey PRIMARY KEY (id);


--
-- Name: quiz_attempts quiz_attempts_pkey; Type: CONSTRAINT; Schema: public; Owner: geek
--

ALTER TABLE ONLY public.quiz_attempts
    ADD CONSTRAINT quiz_attempts_pkey PRIMARY KEY (id);


--
-- Name: review_queue review_queue_pkey; Type: CONSTRAINT; Schema: public; Owner: geek
--

ALTER TABLE ONLY public.review_queue
    ADD CONSTRAINT review_queue_pkey PRIMARY KEY (id);


--
-- Name: rewards rewards_pkey; Type: CONSTRAINT; Schema: public; Owner: geek
--

ALTER TABLE ONLY public.rewards
    ADD CONSTRAINT rewards_pkey PRIMARY KEY (id);


--
-- Name: series_completions series_completions_pkey; Type: CONSTRAINT; Schema: public; Owner: geek
--

ALTER TABLE ONLY public.series_completions
    ADD CONSTRAINT series_completions_pkey PRIMARY KEY (id);


--
-- Name: sticker_packs sticker_packs_pkey; Type: CONSTRAINT; Schema: public; Owner: geek
--

ALTER TABLE ONLY public.sticker_packs
    ADD CONSTRAINT sticker_packs_pkey PRIMARY KEY (id);


--
-- Name: sticker_purchase_transactions sticker_purchase_transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: geek
--

ALTER TABLE ONLY public.sticker_purchase_transactions
    ADD CONSTRAINT sticker_purchase_transactions_pkey PRIMARY KEY (id);


--
-- Name: sticker_series sticker_series_pkey; Type: CONSTRAINT; Schema: public; Owner: geek
--

ALTER TABLE ONLY public.sticker_series
    ADD CONSTRAINT sticker_series_pkey PRIMARY KEY (id);


--
-- Name: stickers stickers_pkey; Type: CONSTRAINT; Schema: public; Owner: geek
--

ALTER TABLE ONLY public.stickers
    ADD CONSTRAINT stickers_pkey PRIMARY KEY (id);


--
-- Name: topics topics_pkey; Type: CONSTRAINT; Schema: public; Owner: geek
--

ALTER TABLE ONLY public.topics
    ADD CONSTRAINT topics_pkey PRIMARY KEY (id);


--
-- Name: treasury_ledger treasury_ledger_pkey; Type: CONSTRAINT; Schema: public; Owner: geek
--

ALTER TABLE ONLY public.treasury_ledger
    ADD CONSTRAINT treasury_ledger_pkey PRIMARY KEY (id);


--
-- Name: user_achievements user_achievements_pkey; Type: CONSTRAINT; Schema: public; Owner: geek
--

ALTER TABLE ONLY public.user_achievements
    ADD CONSTRAINT user_achievements_pkey PRIMARY KEY (id);


--
-- Name: user_notifications user_notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: geek
--

ALTER TABLE ONLY public.user_notifications
    ADD CONSTRAINT user_notifications_pkey PRIMARY KEY (id);


--
-- Name: user_stickers user_stickers_pkey; Type: CONSTRAINT; Schema: public; Owner: geek
--

ALTER TABLE ONLY public.user_stickers
    ADD CONSTRAINT user_stickers_pkey PRIMARY KEY (id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: geek
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: withdrawals withdrawals_pkey; Type: CONSTRAINT; Schema: public; Owner: geek
--

ALTER TABLE ONLY public.withdrawals
    ADD CONSTRAINT withdrawals_pkey PRIMARY KEY (id);


--
-- Name: word_challenge_chats word_challenge_chats_pkey; Type: CONSTRAINT; Schema: public; Owner: geek
--

ALTER TABLE ONLY public.word_challenge_chats
    ADD CONSTRAINT word_challenge_chats_pkey PRIMARY KEY (id);


--
-- Name: word_challenge_daily_challenges word_challenge_daily_challenges_pkey; Type: CONSTRAINT; Schema: public; Owner: geek
--

ALTER TABLE ONLY public.word_challenge_daily_challenges
    ADD CONSTRAINT word_challenge_daily_challenges_pkey PRIMARY KEY (id);


--
-- Name: word_challenge_invites word_challenge_invites_pkey; Type: CONSTRAINT; Schema: public; Owner: geek
--

ALTER TABLE ONLY public.word_challenge_invites
    ADD CONSTRAINT word_challenge_invites_pkey PRIMARY KEY (id);


--
-- Name: word_challenge_moves word_challenge_moves_pkey; Type: CONSTRAINT; Schema: public; Owner: geek
--

ALTER TABLE ONLY public.word_challenge_moves
    ADD CONSTRAINT word_challenge_moves_pkey PRIMARY KEY (id);


--
-- Name: word_challenge_players word_challenge_players_pkey; Type: CONSTRAINT; Schema: public; Owner: geek
--

ALTER TABLE ONLY public.word_challenge_players
    ADD CONSTRAINT word_challenge_players_pkey PRIMARY KEY (id);


--
-- Name: word_challenge_user_progress word_challenge_user_progress_pkey; Type: CONSTRAINT; Schema: public; Owner: geek
--

ALTER TABLE ONLY public.word_challenge_user_progress
    ADD CONSTRAINT word_challenge_user_progress_pkey PRIMARY KEY (id);


--
-- Name: word_challenges word_challenges_pkey; Type: CONSTRAINT; Schema: public; Owner: geek
--

ALTER TABLE ONLY public.word_challenges
    ADD CONSTRAINT word_challenges_pkey PRIMARY KEY (id);


--
-- Name: ai_message_history_userId_idx; Type: INDEX; Schema: public; Owner: geek
--

CREATE INDEX "ai_message_history_userId_idx" ON public.ai_message_history USING btree ("userId");


--
-- Name: ai_recommendations_userId_idx; Type: INDEX; Schema: public; Owner: geek
--

CREATE INDEX "ai_recommendations_userId_idx" ON public.ai_recommendations USING btree ("userId");


--
-- Name: attempts_sessionId_idx; Type: INDEX; Schema: public; Owner: geek
--

CREATE INDEX "attempts_sessionId_idx" ON public.attempts USING btree ("sessionId");


--
-- Name: attempts_userId_idx; Type: INDEX; Schema: public; Owner: geek
--

CREATE INDEX "attempts_userId_idx" ON public.attempts USING btree ("userId");


--
-- Name: character_interactions_userId_idx; Type: INDEX; Schema: public; Owner: geek
--

CREATE INDEX "character_interactions_userId_idx" ON public.character_interactions USING btree ("userId");


--
-- Name: dust_transactions_userId_idx; Type: INDEX; Schema: public; Owner: geek
--

CREATE INDEX "dust_transactions_userId_idx" ON public.dust_transactions USING btree ("userId");


--
-- Name: exchange_listings_sellerId_idx; Type: INDEX; Schema: public; Owner: geek
--

CREATE INDEX "exchange_listings_sellerId_idx" ON public.exchange_listings USING btree ("sellerId");


--
-- Name: exchange_listings_status_idx; Type: INDEX; Schema: public; Owner: geek
--

CREATE INDEX exchange_listings_status_idx ON public.exchange_listings USING btree (status);


--
-- Name: exchange_offers_offererId_idx; Type: INDEX; Schema: public; Owner: geek
--

CREATE INDEX "exchange_offers_offererId_idx" ON public.exchange_offers USING btree ("offererId");


--
-- Name: exchange_transactions_buyerId_idx; Type: INDEX; Schema: public; Owner: geek
--

CREATE INDEX "exchange_transactions_buyerId_idx" ON public.exchange_transactions USING btree ("buyerId");


--
-- Name: exchange_transactions_sellerId_idx; Type: INDEX; Schema: public; Owner: geek
--

CREATE INDEX "exchange_transactions_sellerId_idx" ON public.exchange_transactions USING btree ("sellerId");


--
-- Name: gauntlet_runs_completed_idx; Type: INDEX; Schema: public; Owner: geek
--

CREATE INDEX gauntlet_runs_completed_idx ON public.gauntlet_runs USING btree (completed);


--
-- Name: gauntlet_runs_userId_idx; Type: INDEX; Schema: public; Owner: geek
--

CREATE INDEX "gauntlet_runs_userId_idx" ON public.gauntlet_runs USING btree ("userId");


--
-- Name: geek_dust_userId_idx; Type: INDEX; Schema: public; Owner: geek
--

CREATE INDEX "geek_dust_userId_idx" ON public.geek_dust USING btree ("userId");


--
-- Name: geek_dust_userId_key; Type: INDEX; Schema: public; Owner: geek
--

CREATE UNIQUE INDEX "geek_dust_userId_key" ON public.geek_dust USING btree ("userId");


--
-- Name: kaspa_payments_paymentReference_key; Type: INDEX; Schema: public; Owner: geek
--

CREATE UNIQUE INDEX "kaspa_payments_paymentReference_key" ON public.kaspa_payments USING btree ("paymentReference");


--
-- Name: kaspa_payments_transactionId_key; Type: INDEX; Schema: public; Owner: geek
--

CREATE UNIQUE INDEX "kaspa_payments_transactionId_key" ON public.kaspa_payments USING btree ("transactionId");


--
-- Name: kaspa_payments_userId_idx; Type: INDEX; Schema: public; Owner: geek
--

CREATE INDEX "kaspa_payments_userId_idx" ON public.kaspa_payments USING btree ("userId");


--
-- Name: kyc_verifications_userId_key; Type: INDEX; Schema: public; Owner: geek
--

CREATE UNIQUE INDEX "kyc_verifications_userId_key" ON public.kyc_verifications USING btree ("userId");


--
-- Name: points_conversion_transactions_userId_idx; Type: INDEX; Schema: public; Owner: geek
--

CREATE INDEX "points_conversion_transactions_userId_idx" ON public.points_conversion_transactions USING btree ("userId");


--
-- Name: purchases_stripeSessionId_idx; Type: INDEX; Schema: public; Owner: geek
--

CREATE INDEX "purchases_stripeSessionId_idx" ON public.purchases USING btree ("stripeSessionId");


--
-- Name: purchases_stripeSessionId_key; Type: INDEX; Schema: public; Owner: geek
--

CREATE UNIQUE INDEX "purchases_stripeSessionId_key" ON public.purchases USING btree ("stripeSessionId");


--
-- Name: purchases_userId_idx; Type: INDEX; Schema: public; Owner: geek
--

CREATE INDEX "purchases_userId_idx" ON public.purchases USING btree ("userId");


--
-- Name: questions_status_idx; Type: INDEX; Schema: public; Owner: geek
--

CREATE INDEX questions_status_idx ON public.questions USING btree (status);


--
-- Name: questions_topicId_idx; Type: INDEX; Schema: public; Owner: geek
--

CREATE INDEX "questions_topicId_idx" ON public.questions USING btree ("topicId");


--
-- Name: quiz_attempts_attemptId_idx; Type: INDEX; Schema: public; Owner: geek
--

CREATE INDEX "quiz_attempts_attemptId_idx" ON public.quiz_attempts USING btree ("attemptId");


--
-- Name: quiz_attempts_attemptId_key; Type: INDEX; Schema: public; Owner: geek
--

CREATE UNIQUE INDEX "quiz_attempts_attemptId_key" ON public.quiz_attempts USING btree ("attemptId");


--
-- Name: quiz_attempts_userId_idx; Type: INDEX; Schema: public; Owner: geek
--

CREATE INDEX "quiz_attempts_userId_idx" ON public.quiz_attempts USING btree ("userId");


--
-- Name: rewards_attemptId_key; Type: INDEX; Schema: public; Owner: geek
--

CREATE UNIQUE INDEX "rewards_attemptId_key" ON public.rewards USING btree ("attemptId");


--
-- Name: rewards_status_idx; Type: INDEX; Schema: public; Owner: geek
--

CREATE INDEX rewards_status_idx ON public.rewards USING btree (status);


--
-- Name: rewards_userId_idx; Type: INDEX; Schema: public; Owner: geek
--

CREATE INDEX "rewards_userId_idx" ON public.rewards USING btree ("userId");


--
-- Name: sticker_packs_isOpened_idx; Type: INDEX; Schema: public; Owner: geek
--

CREATE INDEX "sticker_packs_isOpened_idx" ON public.sticker_packs USING btree ("isOpened");


--
-- Name: sticker_packs_userId_idx; Type: INDEX; Schema: public; Owner: geek
--

CREATE INDEX "sticker_packs_userId_idx" ON public.sticker_packs USING btree ("userId");


--
-- Name: topics_name_key; Type: INDEX; Schema: public; Owner: geek
--

CREATE UNIQUE INDEX topics_name_key ON public.topics USING btree (name);


--
-- Name: user_achievements_userId_idx; Type: INDEX; Schema: public; Owner: geek
--

CREATE INDEX "user_achievements_userId_idx" ON public.user_achievements USING btree ("userId");


--
-- Name: user_notifications_userId_idx; Type: INDEX; Schema: public; Owner: geek
--

CREATE INDEX "user_notifications_userId_idx" ON public.user_notifications USING btree ("userId");


--
-- Name: user_stickers_userId_idx; Type: INDEX; Schema: public; Owner: geek
--

CREATE INDEX "user_stickers_userId_idx" ON public.user_stickers USING btree ("userId");


--
-- Name: users_email_key; Type: INDEX; Schema: public; Owner: geek
--

CREATE UNIQUE INDEX users_email_key ON public.users USING btree (email);


--
-- Name: users_id_idx; Type: INDEX; Schema: public; Owner: geek
--

CREATE INDEX users_id_idx ON public.users USING btree (id);


--
-- Name: users_username_key; Type: INDEX; Schema: public; Owner: geek
--

CREATE UNIQUE INDEX users_username_key ON public.users USING btree (username);


--
-- Name: users_walletAddress_key; Type: INDEX; Schema: public; Owner: geek
--

CREATE UNIQUE INDEX "users_walletAddress_key" ON public.users USING btree ("walletAddress");


--
-- Name: withdrawals_userId_idx; Type: INDEX; Schema: public; Owner: geek
--

CREATE INDEX "withdrawals_userId_idx" ON public.withdrawals USING btree ("userId");


--
-- Name: word_challenge_daily_challenges_date_key; Type: INDEX; Schema: public; Owner: geek
--

CREATE UNIQUE INDEX word_challenge_daily_challenges_date_key ON public.word_challenge_daily_challenges USING btree (date);


--
-- Name: word_challenge_players_userId_idx; Type: INDEX; Schema: public; Owner: geek
--

CREATE INDEX "word_challenge_players_userId_idx" ON public.word_challenge_players USING btree ("userId");


--
-- Name: word_challenge_user_progress_userId_idx; Type: INDEX; Schema: public; Owner: geek
--

CREATE INDEX "word_challenge_user_progress_userId_idx" ON public.word_challenge_user_progress USING btree ("userId");


--
-- Name: word_challenges_status_idx; Type: INDEX; Schema: public; Owner: geek
--

CREATE INDEX word_challenges_status_idx ON public.word_challenges USING btree (status);


--
-- Name: achievements achievements_prerequisiteAchievementId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: geek
--

ALTER TABLE ONLY public.achievements
    ADD CONSTRAINT "achievements_prerequisiteAchievementId_fkey" FOREIGN KEY ("prerequisiteAchievementId") REFERENCES public.achievements(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: ai_message_history ai_message_history_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: geek
--

ALTER TABLE ONLY public.ai_message_history
    ADD CONSTRAINT "ai_message_history_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: ai_recommendations ai_recommendations_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: geek
--

ALTER TABLE ONLY public.ai_recommendations
    ADD CONSTRAINT "ai_recommendations_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: attempts attempts_questionId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: geek
--

ALTER TABLE ONLY public.attempts
    ADD CONSTRAINT "attempts_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES public.questions(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: attempts attempts_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: geek
--

ALTER TABLE ONLY public.attempts
    ADD CONSTRAINT "attempts_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: character_interactions character_interactions_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: geek
--

ALTER TABLE ONLY public.character_interactions
    ADD CONSTRAINT "character_interactions_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: creator_earnings creator_earnings_creatorId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: geek
--

ALTER TABLE ONLY public.creator_earnings
    ADD CONSTRAINT "creator_earnings_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: creator_earnings creator_earnings_playerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: geek
--

ALTER TABLE ONLY public.creator_earnings
    ADD CONSTRAINT "creator_earnings_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: creator_earnings creator_earnings_questionId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: geek
--

ALTER TABLE ONLY public.creator_earnings
    ADD CONSTRAINT "creator_earnings_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES public.questions(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: dust_transactions dust_transactions_stickerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: geek
--

ALTER TABLE ONLY public.dust_transactions
    ADD CONSTRAINT "dust_transactions_stickerId_fkey" FOREIGN KEY ("stickerId") REFERENCES public.stickers(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: dust_transactions dust_transactions_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: geek
--

ALTER TABLE ONLY public.dust_transactions
    ADD CONSTRAINT "dust_transactions_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: exchange_listings exchange_listings_completedById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: geek
--

ALTER TABLE ONLY public.exchange_listings
    ADD CONSTRAINT "exchange_listings_completedById_fkey" FOREIGN KEY ("completedById") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: exchange_listings exchange_listings_sellerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: geek
--

ALTER TABLE ONLY public.exchange_listings
    ADD CONSTRAINT "exchange_listings_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: exchange_listings exchange_listings_sellerUserStickerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: geek
--

ALTER TABLE ONLY public.exchange_listings
    ADD CONSTRAINT "exchange_listings_sellerUserStickerId_fkey" FOREIGN KEY ("sellerUserStickerId") REFERENCES public.user_stickers(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: exchange_listings exchange_listings_stickerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: geek
--

ALTER TABLE ONLY public.exchange_listings
    ADD CONSTRAINT "exchange_listings_stickerId_fkey" FOREIGN KEY ("stickerId") REFERENCES public.stickers(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: exchange_offers exchange_offers_listingId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: geek
--

ALTER TABLE ONLY public.exchange_offers
    ADD CONSTRAINT "exchange_offers_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES public.exchange_listings(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: exchange_offers exchange_offers_offererId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: geek
--

ALTER TABLE ONLY public.exchange_offers
    ADD CONSTRAINT "exchange_offers_offererId_fkey" FOREIGN KEY ("offererId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: exchange_transactions exchange_transactions_buyerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: geek
--

ALTER TABLE ONLY public.exchange_transactions
    ADD CONSTRAINT "exchange_transactions_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: exchange_transactions exchange_transactions_listingId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: geek
--

ALTER TABLE ONLY public.exchange_transactions
    ADD CONSTRAINT "exchange_transactions_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES public.exchange_listings(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: exchange_transactions exchange_transactions_sellerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: geek
--

ALTER TABLE ONLY public.exchange_transactions
    ADD CONSTRAINT "exchange_transactions_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: exchange_transactions exchange_transactions_sellerStickerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: geek
--

ALTER TABLE ONLY public.exchange_transactions
    ADD CONSTRAINT "exchange_transactions_sellerStickerId_fkey" FOREIGN KEY ("sellerStickerId") REFERENCES public.stickers(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: gauntlet_claims gauntlet_claims_runId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: geek
--

ALTER TABLE ONLY public.gauntlet_claims
    ADD CONSTRAINT "gauntlet_claims_runId_fkey" FOREIGN KEY ("runId") REFERENCES public.gauntlet_runs(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: gauntlet_claims gauntlet_claims_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: geek
--

ALTER TABLE ONLY public.gauntlet_claims
    ADD CONSTRAINT "gauntlet_claims_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: gauntlet_runs gauntlet_runs_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: geek
--

ALTER TABLE ONLY public.gauntlet_runs
    ADD CONSTRAINT "gauntlet_runs_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: geek_dust geek_dust_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: geek
--

ALTER TABLE ONLY public.geek_dust
    ADD CONSTRAINT "geek_dust_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: kaspa_payments kaspa_payments_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: geek
--

ALTER TABLE ONLY public.kaspa_payments
    ADD CONSTRAINT "kaspa_payments_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: kyc_verifications kyc_verifications_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: geek
--

ALTER TABLE ONLY public.kyc_verifications
    ADD CONSTRAINT "kyc_verifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: points_conversion_transactions points_conversion_transactions_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: geek
--

ALTER TABLE ONLY public.points_conversion_transactions
    ADD CONSTRAINT "points_conversion_transactions_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: purchases purchases_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: geek
--

ALTER TABLE ONLY public.purchases
    ADD CONSTRAINT "purchases_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: question_validations question_validations_questionId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: geek
--

ALTER TABLE ONLY public.question_validations
    ADD CONSTRAINT "question_validations_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES public.questions(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: question_validations question_validations_validatorId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: geek
--

ALTER TABLE ONLY public.question_validations
    ADD CONSTRAINT "question_validations_validatorId_fkey" FOREIGN KEY ("validatorId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: questions questions_approvedBy_fkey; Type: FK CONSTRAINT; Schema: public; Owner: geek
--

ALTER TABLE ONLY public.questions
    ADD CONSTRAINT "questions_approvedBy_fkey" FOREIGN KEY ("approvedBy") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: questions questions_createdBy_fkey; Type: FK CONSTRAINT; Schema: public; Owner: geek
--

ALTER TABLE ONLY public.questions
    ADD CONSTRAINT "questions_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: questions questions_topicId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: geek
--

ALTER TABLE ONLY public.questions
    ADD CONSTRAINT "questions_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES public.topics(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: questions questions_validatedBy_fkey; Type: FK CONSTRAINT; Schema: public; Owner: geek
--

ALTER TABLE ONLY public.questions
    ADD CONSTRAINT "questions_validatedBy_fkey" FOREIGN KEY ("validatedBy") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: quiz_attempts quiz_attempts_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: geek
--

ALTER TABLE ONLY public.quiz_attempts
    ADD CONSTRAINT "quiz_attempts_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: review_queue review_queue_questionId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: geek
--

ALTER TABLE ONLY public.review_queue
    ADD CONSTRAINT "review_queue_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES public.questions(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: rewards rewards_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: geek
--

ALTER TABLE ONLY public.rewards
    ADD CONSTRAINT "rewards_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: series_completions series_completions_seriesId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: geek
--

ALTER TABLE ONLY public.series_completions
    ADD CONSTRAINT "series_completions_seriesId_fkey" FOREIGN KEY ("seriesId") REFERENCES public.sticker_series(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: series_completions series_completions_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: geek
--

ALTER TABLE ONLY public.series_completions
    ADD CONSTRAINT "series_completions_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: sticker_packs sticker_packs_seriesId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: geek
--

ALTER TABLE ONLY public.sticker_packs
    ADD CONSTRAINT "sticker_packs_seriesId_fkey" FOREIGN KEY ("seriesId") REFERENCES public.sticker_series(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: sticker_packs sticker_packs_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: geek
--

ALTER TABLE ONLY public.sticker_packs
    ADD CONSTRAINT "sticker_packs_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: sticker_purchase_transactions sticker_purchase_transactions_buyerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: geek
--

ALTER TABLE ONLY public.sticker_purchase_transactions
    ADD CONSTRAINT "sticker_purchase_transactions_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: sticker_purchase_transactions sticker_purchase_transactions_stickerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: geek
--

ALTER TABLE ONLY public.sticker_purchase_transactions
    ADD CONSTRAINT "sticker_purchase_transactions_stickerId_fkey" FOREIGN KEY ("stickerId") REFERENCES public.stickers(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: stickers stickers_seriesId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: geek
--

ALTER TABLE ONLY public.stickers
    ADD CONSTRAINT "stickers_seriesId_fkey" FOREIGN KEY ("seriesId") REFERENCES public.sticker_series(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: user_achievements user_achievements_achievementId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: geek
--

ALTER TABLE ONLY public.user_achievements
    ADD CONSTRAINT "user_achievements_achievementId_fkey" FOREIGN KEY ("achievementId") REFERENCES public.achievements(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: user_achievements user_achievements_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: geek
--

ALTER TABLE ONLY public.user_achievements
    ADD CONSTRAINT "user_achievements_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: user_notifications user_notifications_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: geek
--

ALTER TABLE ONLY public.user_notifications
    ADD CONSTRAINT "user_notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: user_stickers user_stickers_stickerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: geek
--

ALTER TABLE ONLY public.user_stickers
    ADD CONSTRAINT "user_stickers_stickerId_fkey" FOREIGN KEY ("stickerId") REFERENCES public.stickers(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: user_stickers user_stickers_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: geek
--

ALTER TABLE ONLY public.user_stickers
    ADD CONSTRAINT "user_stickers_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: withdrawals withdrawals_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: geek
--

ALTER TABLE ONLY public.withdrawals
    ADD CONSTRAINT "withdrawals_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: word_challenge_chats word_challenge_chats_challengeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: geek
--

ALTER TABLE ONLY public.word_challenge_chats
    ADD CONSTRAINT "word_challenge_chats_challengeId_fkey" FOREIGN KEY ("challengeId") REFERENCES public.word_challenges(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: word_challenge_chats word_challenge_chats_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: geek
--

ALTER TABLE ONLY public.word_challenge_chats
    ADD CONSTRAINT "word_challenge_chats_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: word_challenge_invites word_challenge_invites_challengeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: geek
--

ALTER TABLE ONLY public.word_challenge_invites
    ADD CONSTRAINT "word_challenge_invites_challengeId_fkey" FOREIGN KEY ("challengeId") REFERENCES public.word_challenges(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: word_challenge_invites word_challenge_invites_inviteeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: geek
--

ALTER TABLE ONLY public.word_challenge_invites
    ADD CONSTRAINT "word_challenge_invites_inviteeId_fkey" FOREIGN KEY ("inviteeId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: word_challenge_invites word_challenge_invites_inviterId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: geek
--

ALTER TABLE ONLY public.word_challenge_invites
    ADD CONSTRAINT "word_challenge_invites_inviterId_fkey" FOREIGN KEY ("inviterId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: word_challenge_moves word_challenge_moves_challengeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: geek
--

ALTER TABLE ONLY public.word_challenge_moves
    ADD CONSTRAINT "word_challenge_moves_challengeId_fkey" FOREIGN KEY ("challengeId") REFERENCES public.word_challenges(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: word_challenge_moves word_challenge_moves_playerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: geek
--

ALTER TABLE ONLY public.word_challenge_moves
    ADD CONSTRAINT "word_challenge_moves_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES public.word_challenge_players(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: word_challenge_players word_challenge_players_challengeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: geek
--

ALTER TABLE ONLY public.word_challenge_players
    ADD CONSTRAINT "word_challenge_players_challengeId_fkey" FOREIGN KEY ("challengeId") REFERENCES public.word_challenges(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: word_challenge_players word_challenge_players_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: geek
--

ALTER TABLE ONLY public.word_challenge_players
    ADD CONSTRAINT "word_challenge_players_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: word_challenge_user_progress word_challenge_user_progress_challengeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: geek
--

ALTER TABLE ONLY public.word_challenge_user_progress
    ADD CONSTRAINT "word_challenge_user_progress_challengeId_fkey" FOREIGN KEY ("challengeId") REFERENCES public.word_challenge_daily_challenges(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: word_challenge_user_progress word_challenge_user_progress_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: geek
--

ALTER TABLE ONLY public.word_challenge_user_progress
    ADD CONSTRAINT "word_challenge_user_progress_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: word_challenges word_challenges_winnerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: geek
--

ALTER TABLE ONLY public.word_challenges
    ADD CONSTRAINT "word_challenges_winnerId_fkey" FOREIGN KEY ("winnerId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: geek
--

REVOKE USAGE ON SCHEMA public FROM PUBLIC;


--
-- PostgreSQL database dump complete
--

\unrestrict 4DhWQSTKBD6L2VxbB94lrJqvb3P2NqdHqjC0gPGnZbqbktHqFsZF0nBD9ZUtdpX

