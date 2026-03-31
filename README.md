# 📦 Dr. Imports - Sistema de Gestão de Estoque e Finanças

![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Vite](https://img.shields.io/badge/Vite-B73BFE?style=for-the-badge&logo=vite&logoColor=FFD62E)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-181818?style=for-the-badge&logo=supabase&logoColor=3ECF8E)

Um mini-ERP (Enterprise Resource Planning) completo desenvolvido como Software as a Service (SaaS) para gerenciamento de importações, controle de estoque inteligente e registro de vendas financeiras.

## 🚀 Sobre o Projeto

O **Dr. Imports** nasceu da necessidade de gerenciar o ciclo de vida de produtos importados, desde o cálculo complexo de custos na compra internacional (dólar, taxas e frete) até a precificação final, controle de avarias, doações e vendas locais. O sistema oferece uma visão clara do fluxo de caixa e da saúde do estoque em tempo real.

---

## ✨ Principais Funcionalidades

- **📊 Dashboard Dinâmico:** Visão geral do faturamento bruto, custos de importação, lucro estimado e alertas automáticos de estoque crítico.
- **🛩️ Módulo de Importações:** Motor matemático integrado que calcula o custo unitário em Reais (BRL) baseado na cotação do dólar e taxas extras em tempo real.
- **🛒 PDV e Saídas:** Registro de vendas comerciais, brindes, doações e perdas por avaria. Baixa automática no estoque.
- **🔐 Gestão de Acessos (RBAC):** Controle de usuários com níveis de permissão (Administrador e Usuário Padrão).
- **⚙️ Configurações e Exportação:** Definição de variáveis globais (ex: alerta de estoque) e exportação de relatórios financeiros em `.csv`.

---

## 🛡️ Segurança e Arquitetura

Este projeto foi construído seguindo as melhores práticas de segurança de mercado para aplicações modernas (BaaS):

1. **Row Level Security (RLS):** Todas as tabelas do banco de dados (PostgreSQL) possuem políticas estritas. Nenhuma operação de leitura ou escrita ocorre sem um token JWT de usuário autenticado.
2. **Proteção de Inserção/Deleção (Admin Only):** Operações críticas, como criar novos usuários ou deletar registros, são bloqueadas diretamente no banco de dados para usuários não-administradores, prevenindo ataques via console do navegador.
3. **Soft Deletes (Deleção Lógica):** Para manter a integridade do histórico financeiro e relatórios de vendas, registros deletados não são apagados fisicamente (`DELETE`), mas sim ocultados via coluna `deleted_at`.
4. **Data Formatting & UX:** Utilização de máscaras rigorosas de input financeiro no frontend para garantir que o banco de dados receba exclusivamente valores `float` limpos e padronizados.

---

## 🛠️ Tecnologias Utilizadas

- **Frontend:** React, Vite, TypeScript
- **Estilização:** Tailwind CSS, Lucide Icons
- **Backend / Banco de Dados:** Supabase (PostgreSQL), Supabase Auth
- **Gerenciamento de Formulários/Máscaras:** React Number Format
- **Notificações:** React Hot Toast, SweetAlert2
- **Deploy:** Vercel

---

## 💻 Rodando Localmente

Siga os passos abaixo para rodar o projeto na sua máquina:

1. Clone o repositório:
   ```bash
   git clone [https://github.com/alestarke/drimports-frontend](https://github.com/alestarke/drimports-frontend)
   ```

2. Acesse a pasta do projeto:
   ```bash
   cd drimports-frontend
   ```

3. Instale as dependências:
   ```bash
   npm install
   ```

4. Configure as variáveis de ambiente:
   Crie um arquivo `.env` na raiz do projeto com as suas chaves do Supabase:
   ```env
   VITE_SUPABASE_URL=sua_url_aqui
   VITE_SUPABASE_ANON_KEY=sua_anon_key_aqui
   ```

5. Inicie o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```
   
## 🐳 Docker (Ambiente de Desenvolvimento)

Este projeto está containerizado para facilitar o setup do ambiente.

1.  **Build da Imagem:**
    ```bash
    docker build -t drimports-dev .
    ```

2.  **Rodar o Container:**
    ```bash
    docker run -p 5173:5173 --env-file .env drimports-dev
    ```
    *O sistema estará disponível em `http://localhost:5173`*