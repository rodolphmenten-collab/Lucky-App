-- Un lieu peut être éteint sans être supprimé.
--
-- C'est ce que demande l'offre à la soirée : les supports restent sur place —
-- on ne récupère pas des QR personnalisés, ils sont perdus de toute façon —
-- et c'est le QR qui cesse de fonctionner à la fin. Sans ça, un lieu qui a
-- payé une soirée garderait un service actif indéfiniment.
--
-- Sert aussi aux impayés et aux lieux qui suspendent : supprimer la fiche
-- ferait perdre l'historique et le chiffre d'affaires déjà tracké.

alter table venues add column if not exists active boolean not null default true;

-- Pourquoi il a été éteint, pour que l'autre associé le sache six semaines
-- plus tard sans avoir à demander.
alter table venues add column if not exists deactivated_at timestamptz;
alter table venues add column if not exists deactivation_reason text;
