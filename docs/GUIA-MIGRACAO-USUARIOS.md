# Guia: Migrar Vendedores Existentes para Supabase Auth

## Como funciona

O app agora faz login via Supabase Auth (email + senha). Depois do login, ele busca o vendedor na tabela `vendedores` **pelo email**. Então para cada pessoa que já está cadastrada, você precisa:

1. Criar uma conta no Supabase Auth **com o mesmo email** que já está na tabela `vendedores`
2. (Opcional) Vincular o `auth_user_id` e definir o `role`

## Passo a passo

### 1. Abrir o Supabase Dashboard

Acesse: https://supabase.com/dashboard
Selecione o projeto do ControlAGRO.

### 2. Ver os vendedores atuais

No menu lateral, vá em **Table Editor** → tabela `vendedores`.
Anote o **email** de cada vendedor ativo. Exemplo:

| nome            | email                    | role     |
|-----------------|--------------------------|----------|
| Rodrigo Silva   | rodrigo@fazendeiro.com   | vendedor |
| Edmundo Costa   | edmundo@fazendeiro.com   | vendedor |
| Marina          | marina@fazendeiro.com    | gestor   |

### 3. Criar as contas no Auth

No menu lateral, vá em **Authentication** → **Users** → botão **Add user** → **Create new user**.

Para **cada vendedor**, preencha:

- **Email**: o mesmo email que está na tabela `vendedores` (exatamente igual)
- **Password**: defina uma senha temporária (ex: `ControlAgro2026!`)
- **Auto Confirm User**: marque SIM (para não precisar de confirmação por email)

Repita para todos os vendedores e gestores.

### 4. Atualizar a tabela vendedores (role e auth_user_id)

Depois de criar todos os usuários no Auth, volte em **Authentication** → **Users** e copie o **User UID** de cada um.

Agora vá em **SQL Editor** (menu lateral) e execute os comandos para vincular e definir roles:

```sql
-- Para cada VENDEDOR, substituir os valores:
UPDATE vendedores
SET auth_user_id = 'COLE-O-UUID-DO-AUTH-AQUI'
WHERE email = 'rodrigo@fazendeiro.com';

UPDATE vendedores
SET auth_user_id = 'COLE-O-UUID-DO-AUTH-AQUI'
WHERE email = 'edmundo@fazendeiro.com';

-- Para cada GESTOR, definir o role também:
UPDATE vendedores
SET role = 'gestor', auth_user_id = 'COLE-O-UUID-DO-AUTH-AQUI'
WHERE email = 'marina@fazendeiro.com';
```

### 5. Testar o login

Abra o app e faça login com o email e a senha que você definiu no passo 3.
O app vai autenticar via Supabase Auth e depois encontrar o vendedor pelo email — todos os dados (clientes, visitas, contatos, plantios) continuam vinculados ao mesmo `vendedor_id` de antes.

### 6. Pedir para cada vendedor trocar a senha

Como a senha foi definida por você, peça para cada vendedor trocar. Isso pode ser feito de duas formas:

**Opção A — Pelo Dashboard do Supabase:**
Authentication → Users → clicar no usuário → **Send password recovery** (envia email para o vendedor redefinir)

**Opção B — Informar a senha temporária:**
Passe a senha temporária para cada vendedor e depois, futuramente, implemente uma tela de "Esqueci minha senha" no app.

## Por que os dados não se perdem?

Os dados (clientes, visitas, contatos, plantios) estão vinculados ao `vendedor_id` (UUID na tabela `vendedores`). O registro do vendedor continua sendo **o mesmo** — você não está criando um vendedor novo, apenas criando uma conta de autenticação que aponta para o email dele. O `vendedor_id` não muda.

## Resumo rápido

```
Supabase Auth (novo)          Tabela vendedores (já existe)
┌─────────────────────┐       ┌──────────────────────────┐
│ email: rodrigo@...  │──────▶│ email: rodrigo@...       │
│ password: ****      │ match │ id: abc-123 (não muda)   │
│ uid: xyz-789        │  by   │ auth_user_id: xyz-789    │
└─────────────────────┘ email │ role: vendedor            │
                              │ → clientes, visitas, etc. │
                              └──────────────────────────┘
```
