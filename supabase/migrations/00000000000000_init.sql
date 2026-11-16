-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.controle_lupeon (
  id integer NOT NULL DEFAULT nextval('controle_lupeon_id_seq'::regclass),
  dt character varying,
  nf character varying,
  evento character varying,
  data_coleta date,
  data_upload date,
  status character varying,
  observacao character varying,
  criado_em timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  evento_id integer,
  CONSTRAINT controle_lupeon_pkey PRIMARY KEY (id),
  CONSTRAINT fk_evento_relacao FOREIGN KEY (evento_id) REFERENCES public.eventos(id)
);
CREATE TABLE public.eventos (
  id integer NOT NULL DEFAULT nextval('eventos_id_seq'::regclass),
  nome_evento character varying NOT NULL UNIQUE,
  CONSTRAINT eventos_pkey PRIMARY KEY (id)
);