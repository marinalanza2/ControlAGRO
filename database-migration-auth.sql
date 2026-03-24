-- =====================================================
-- CONTROLAGRO - Migração: Autenticação com Supabase Auth
-- Execute este script no SQL Editor do Supabase
-- para migrar um banco existente para autenticação real.
-- =====================================================

-- 1. Adicionar campo role na tabela vendedores
ALTER TABLE vendedores ADD COLUMN IF NOT EXISTS role VARCHAR(20) DEFAULT 'vendedor' CHECK (role IN ('vendedor', 'gestor'));

-- 2. Vincular vendedores ao auth.users do Supabase Auth
ALTER TABLE vendedores ADD COLUMN IF NOT EXISTS auth_user_id UUID REFERENCES auth.users(id);
CREATE INDEX IF NOT EXISTS idx_vendedores_auth ON vendedores(auth_user_id);

-- 3. Adicionar campos de lembrete se não existirem (da branch de relatórios)
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS lembrete_data DATE;
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS lembrete_nota TEXT;
CREATE INDEX IF NOT EXISTS idx_clientes_lembrete ON clientes(lembrete_data) WHERE lembrete_data IS NOT NULL;

-- 4. Criar tabela plantios se não existir
CREATE TABLE IF NOT EXISTS plantios (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    cliente_id UUID REFERENCES clientes(id) ON DELETE CASCADE NOT NULL,
    cultura VARCHAR(100) NOT NULL CHECK (cultura IN ('Soja', 'Milho', 'Grãos', 'Silagem', 'Outro')),
    tipo VARCHAR(50) DEFAULT 'Safra' CHECK (tipo IN ('Safra', 'Safrinha', 'Teste')),
    data_plantio DATE NOT NULL,
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_plantios_cliente ON plantios(cliente_id);
CREATE INDEX IF NOT EXISTS idx_plantios_ativo ON plantios(ativo) WHERE ativo = true;
CREATE INDEX IF NOT EXISTS idx_plantios_data ON plantios(data_plantio DESC);
CREATE INDEX IF NOT EXISTS idx_plantios_cultura ON plantios(cultura);

ALTER TABLE plantios ENABLE ROW LEVEL SECURITY;

DROP TRIGGER IF EXISTS update_plantios_updated_at ON plantios;
CREATE TRIGGER update_plantios_updated_at BEFORE UPDATE ON plantios FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 5. REMOVER policies anônimas (segurança de produção)
-- =====================================================
DROP POLICY IF EXISTS "Permitir leitura pública vendedores" ON vendedores;
DROP POLICY IF EXISTS "Permitir leitura pública clientes" ON clientes;
DROP POLICY IF EXISTS "Permitir leitura pública visitas" ON visitas;
DROP POLICY IF EXISTS "Permitir leitura pública contatos" ON contatos;
DROP POLICY IF EXISTS "Permitir leitura pública plantios" ON plantios;
DROP POLICY IF EXISTS "Permitir inserção pública clientes" ON clientes;
DROP POLICY IF EXISTS "Permitir inserção pública visitas" ON visitas;
DROP POLICY IF EXISTS "Permitir inserção pública contatos" ON contatos;
DROP POLICY IF EXISTS "Permitir inserção pública plantios" ON plantios;
DROP POLICY IF EXISTS "Permitir atualização pública clientes" ON clientes;
DROP POLICY IF EXISTS "Permitir atualização pública visitas" ON visitas;
DROP POLICY IF EXISTS "Permitir atualização pública plantios" ON plantios;

-- =====================================================
-- 6. Recriar RLS policies para authenticated apenas
-- =====================================================

-- Vendedores
DROP POLICY IF EXISTS "Vendedores são visíveis para todos autenticados" ON vendedores;
CREATE POLICY "Vendedores são visíveis para todos autenticados" ON vendedores FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Vendedores podem atualizar próprio perfil" ON vendedores;
CREATE POLICY "Vendedores podem atualizar próprio perfil" ON vendedores FOR UPDATE TO authenticated USING (auth_user_id = auth.uid());

-- Clientes
DROP POLICY IF EXISTS "Clientes são visíveis para todos autenticados" ON clientes;
CREATE POLICY "Clientes são visíveis para todos autenticados" ON clientes FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Vendedores podem inserir clientes" ON clientes;
CREATE POLICY "Vendedores podem inserir clientes" ON clientes FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Vendedores podem atualizar clientes" ON clientes;
CREATE POLICY "Vendedores podem atualizar clientes" ON clientes FOR UPDATE TO authenticated USING (true);

-- Visitas
DROP POLICY IF EXISTS "Visitas são visíveis para todos autenticados" ON visitas;
CREATE POLICY "Visitas são visíveis para todos autenticados" ON visitas FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Vendedores podem inserir visitas" ON visitas;
CREATE POLICY "Vendedores podem inserir visitas" ON visitas FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Vendedores podem atualizar próprias visitas" ON visitas;
CREATE POLICY "Vendedores podem atualizar próprias visitas" ON visitas FOR UPDATE TO authenticated USING (true);

-- Contatos
DROP POLICY IF EXISTS "Contatos são visíveis para todos autenticados" ON contatos;
CREATE POLICY "Contatos são visíveis para todos autenticados" ON contatos FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Vendedores podem inserir contatos" ON contatos;
CREATE POLICY "Vendedores podem inserir contatos" ON contatos FOR INSERT TO authenticated WITH CHECK (true);

-- Plantios
DROP POLICY IF EXISTS "Plantios são visíveis para todos autenticados" ON plantios;
CREATE POLICY "Plantios são visíveis para todos autenticados" ON plantios FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Vendedores podem inserir plantios" ON plantios;
CREATE POLICY "Vendedores podem inserir plantios" ON plantios FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Vendedores podem atualizar plantios" ON plantios;
CREATE POLICY "Vendedores podem atualizar plantios" ON plantios FOR UPDATE TO authenticated USING (true);

-- =====================================================
-- 7. Revogar acesso anon às views, manter authenticated
-- =====================================================
REVOKE SELECT ON dashboard_stats FROM anon;
REVOKE SELECT ON visitas_completas FROM anon;
REVOKE SELECT ON vendedores_performance FROM anon;
REVOKE SELECT ON agenda_lembretes FROM anon;
REVOKE SELECT ON agenda_plantios FROM anon;

GRANT SELECT ON dashboard_stats TO authenticated;
GRANT SELECT ON visitas_completas TO authenticated;
GRANT SELECT ON vendedores_performance TO authenticated;
GRANT SELECT ON agenda_lembretes TO authenticated;
GRANT SELECT ON agenda_plantios TO authenticated;

-- =====================================================
-- 8. Criar views de agenda se não existirem
-- =====================================================
CREATE OR REPLACE VIEW agenda_lembretes AS
SELECT
    c.id as cliente_id,
    c.nome as cliente_nome,
    c.propriedade_nome,
    c.cidade,
    c.lembrete_data,
    c.lembrete_nota,
    c.vendedor_id,
    v.nome as vendedor_nome,
    CASE
        WHEN c.lembrete_data < CURRENT_DATE THEN 'ATRASADO'
        WHEN c.lembrete_data = CURRENT_DATE THEN 'HOJE'
        WHEN c.lembrete_data <= CURRENT_DATE + INTERVAL '7 days' THEN 'FUTURO'
        ELSE 'FUTURO_DISTANTE'
    END as status_lembrete
FROM clientes c
LEFT JOIN vendedores v ON c.vendedor_id = v.id
WHERE c.ativo = true
  AND c.lembrete_data IS NOT NULL
ORDER BY c.lembrete_data ASC;

CREATE OR REPLACE VIEW agenda_plantios AS
SELECT
    p.id as plantio_id,
    p.cliente_id,
    c.nome as cliente_nome,
    c.propriedade_nome,
    c.cidade,
    p.cultura,
    p.tipo,
    p.data_plantio,
    (CURRENT_DATE - p.data_plantio)::INTEGER as dias_plantio,
    c.vendedor_id,
    v.nome as vendedor_nome
FROM plantios p
LEFT JOIN clientes c ON p.cliente_id = c.id
LEFT JOIN vendedores v ON c.vendedor_id = v.id
WHERE p.ativo = true
  AND c.ativo = true
  AND p.data_plantio <= CURRENT_DATE
ORDER BY p.data_plantio DESC;

SELECT 'Migração de autenticação concluída com sucesso!' as status;

-- =====================================================
-- 9. Vincular vendedores existentes ao Supabase Auth
--
-- Os usuários abaixo foram criados manualmente no
-- Supabase Auth (Dashboard > Authentication > Users > Add user)
-- e vinculados à tabela vendedores pelo auth_user_id.
-- =====================================================

-- Gestores
UPDATE vendedores SET role = 'gestor' WHERE email = 'ivo@fazendeiro.com';
UPDATE vendedores SET role = 'gestor' WHERE email = 'gladston@fazendeiro.com';

-- Vincular auth_user_id
UPDATE vendedores SET auth_user_id = '16e23fd5-7a3c-4a96-9642-b7e43b88ce98' WHERE email = 'edmundo@fazendeiro.com';
UPDATE vendedores SET auth_user_id = '8b24989c-085d-4a76-ae75-f6e56b4b19da' WHERE email = 'gladston@fazendeiro.com';
UPDATE vendedores SET auth_user_id = '8252e466-51c2-4d5c-8426-ff18fbabd1d1' WHERE email = 'rodrigo@fazendeiro.com';

-- =====================================================
-- NOTA: Para novos vendedores, repetir o processo:
-- 1. Criar usuário no Supabase Auth (Dashboard > Authentication > Add user)
-- 2. Copiar o UUID gerado
-- 3. Executar:
--    UPDATE vendedores SET auth_user_id = 'UUID' WHERE email = 'email@fazendeiro.com';
--    UPDATE vendedores SET role = 'gestor' WHERE email = '...';  -- se for gestor
-- =====================================================
