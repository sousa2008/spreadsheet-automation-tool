<?php
    class SupabaseClient {
        private string $url;
        private string $key;

        public function __construct(string $url, string $key){
            $this->url = rtrim($url, '/');
            $this->key = $key;
        }

        public function buscar(string $tabela, string $query = "select=*"){
            $endpoint = "{$this->url}/{$tabela}?{$query}";
            $ch = curl_init($endpoint);
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($ch, CURLOPT_HTTPHEADER, [
                "apikey: {$this->key}",
                "Authorization: Bearer {$this->key}"
            ]);

            $resposta = curl_exec($ch);         // Isso tudo roda em segundo plano 
         
            if ($resposta === false){
                throw new exception(curl_error($ch));
            }
            $dados = json_decode($resposta, true);
            return is_array($dados) ? $dados : [];
        }

        public function buscarTodos(string $tabela, string $query = "select=*"): array {
            $todos = [];
            $offset = 0;
            $limite = 1000;

            do {
                $queryPaginada = "{$query}&limit={$limite}&offset={$offset}";
                $lote = $this->buscar($tabela, $queryPaginada);
                $todos = array_merge($todos, $lote);
                $offset += $limite;
            } while (count($lote) === $limite);

            return $todos;
        }
    }
