'use client';

import { useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';

interface ProfileData {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
}

interface ProfileEditorProps {
  profile: ProfileData;
  onClose: () => void;
  onSaved: (updated: { username: string; display_name: string | null }) => void;
}

export function ProfileEditor({ profile, onClose, onSaved }: ProfileEditorProps) {
  const { user } = useAuth();
  const [displayName, setDisplayName] = useState(profile.display_name || '');
  const [username, setUsername] = useState(profile.username);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = useCallback(async () => {
    if (!user) return;

    const trimmedUsername = username.trim().toLowerCase();
    const trimmedName = displayName.trim();

    if (trimmedUsername.length < 3) {
      setError('Uživatelské jméno musí mít alespoň 3 znaky');
      return;
    }

    if (!/^[a-z0-9_]+$/.test(trimmedUsername)) {
      setError('Uživatelské jméno může obsahovat jen písmena, čísla a podtržítko');
      return;
    }

    setSaving(true);
    setError(null);

    const supabase = createClient();

    // Check username uniqueness if changed
    if (trimmedUsername !== profile.username) {
      const { data: existing } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', trimmedUsername)
        .neq('id', user.id)
        .single();

      if (existing) {
        setError('Toto uživatelské jméno je obsazené');
        setSaving(false);
        return;
      }
    }

    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        username: trimmedUsername,
        display_name: trimmedName || null,
      })
      .eq('id', user.id);

    if (updateError) {
      setError('Nepodařilo se uložit změny');
      setSaving(false);
      return;
    }

    onSaved({
      username: trimmedUsername,
      display_name: trimmedName || null,
    });
  }, [user, username, displayName, profile.username, onSaved]);

  return (
    <Modal open onClose={onClose} title="Upravit profil">
      <div className="space-y-4">
        {/* Avatar preview */}
        <div className="flex justify-center">
          <Avatar
            src={profile.avatar_url}
            name={displayName || username}
            size="lg"
            className="!h-16 !w-16 !text-xl"
          />
        </div>
        {profile.avatar_url && (
          <p className="text-center text-xs text-gray-600">
            Avatar se přebírá z Google účtu
          </p>
        )}

        <Input
          label="Zobrazované jméno"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="Jan Novák"
          maxLength={50}
        />

        <Input
          label="Uživatelské jméno"
          value={username}
          onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
          placeholder="jan_novak"
          maxLength={30}
        />

        {error && (
          <p className="text-sm text-red-400 text-center">{error}</p>
        )}

        <div className="flex gap-3 pt-2">
          <Button variant="ghost" size="md" className="flex-1" onClick={onClose}>
            Zrušit
          </Button>
          <Button variant="primary" size="md" className="flex-1" loading={saving} onClick={handleSave}>
            Uložit
          </Button>
        </div>
      </div>
    </Modal>
  );
}
