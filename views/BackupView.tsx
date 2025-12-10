import React, { useState } from 'react';
import { Icons } from '../components/ui/Icons';

interface Backup {
    id: string;
    date: string;
    size: string;
    type: 'Full' | 'Products' | 'Theme';
    status: 'Verified' | 'Corrupted';
}

const MOCK_BACKUPS: Backup[] = [
    { id: 'bk_1', date: '25.02.2025 04:00', size: '45.2 MB', type: 'Full', status: 'Verified' },
    { id: 'bk_2', date: '24.02.2025 04:00', size: '44.8 MB', type: 'Full', status: 'Verified' },
    { id: 'bk_3', date: '24.02.2025 12:30', size: '2.1 MB', type: 'Products', status: 'Verified' },
];

export const BackupView: React.FC = () => {
    const [backups, setBackups] = useState<Backup[]>(MOCK_BACKUPS);
    const [processing, setProcessing] = useState(false);

    const createBackup = () => {
        setProcessing(true);
        setTimeout(() => {
            const newBackup: Backup = {
                id: `bk_${Date.now()}`,
                date: new Date().toLocaleString('de-CH'),
                size: '2.4 MB',
                type: 'Products',
                status: 'Verified'
            };
            setBackups([newBackup, ...backups]);
            setProcessing(false);
        }, 2000);
    };

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-white">Backup Manager</h2>
                    <p className="text-slate-400 text-sm">Sichern Sie Ihren Shop vor grossen Änderungen.</p>
                </div>
                <button 
                    onClick={createBackup}
                    disabled={processing}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors shadow-lg shadow-emerald-500/20"
                >
                    {processing ? <Icons.Refresh className="w-4 h-4 animate-spin" /> : <Icons.Save className="w-4 h-4" />}
                    Jetzt sichern
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Stats */}
                <div className="glass-panel p-6 rounded-2xl flex flex-col justify-between">
                    <div>
                        <h3 className="text-lg font-semibold text-white mb-2">Speicherstatus</h3>
                        <p className="text-slate-400 text-sm">Lokaler Speicherplatz für Backups</p>
                    </div>
                    <div className="mt-6">
                         <div className="flex justify-between text-sm mb-2">
                             <span className="text-white">Belegt</span>
                             <span className="text-indigo-400">1.2 GB / 5 GB</span>
                         </div>
                         <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                             <div className="h-full bg-indigo-500 w-[24%]"></div>
                         </div>
                    </div>
                </div>
                 <div className="glass-panel p-6 rounded-2xl flex flex-col justify-between">
                    <div>
                        <h3 className="text-lg font-semibold text-white mb-2">Letztes Full-Backup</h3>
                        <div className="flex items-center gap-2 mt-2">
                            <Icons.Check className="w-5 h-5 text-emerald-500" />
                            <span className="text-white font-mono">25.02.2025</span>
                        </div>
                    </div>
                    <button className="mt-4 text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1">
                        Verlauf ansehen <Icons.ChevronRight className="w-3 h-3" />
                    </button>
                </div>
                 <div className="glass-panel p-6 rounded-2xl flex flex-col justify-between border-l-4 border-l-amber-500 bg-amber-500/5">
                    <div>
                        <h3 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
                            <Icons.AlertTriangle className="w-5 h-5 text-amber-500" /> Restore Hinweis
                        </h3>
                        <p className="text-amber-200/80 text-xs">
                            Ein Restore überschreibt alle aktuellen Produktdaten. Kundenbestellungen bleiben unberührt.
                        </p>
                    </div>
                </div>
            </div>

            <div className="glass-panel rounded-2xl overflow-hidden border border-white/5">
                <div className="px-6 py-4 border-b border-white/5 flex items-center gap-2 bg-white/5">
                    <Icons.History className="w-5 h-5 text-slate-400" />
                    <h3 className="font-semibold text-white">Backup Historie</h3>
                </div>
                <table className="w-full text-left text-sm">
                    <thead>
                        <tr className="bg-white/5 border-b border-white/5 text-slate-400">
                            <th className="p-4 font-medium">Datum</th>
                            <th className="p-4 font-medium">Typ</th>
                            <th className="p-4 font-medium">Grösse</th>
                            <th className="p-4 font-medium">Status</th>
                            <th className="p-4 font-medium text-right">Aktionen</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {backups.map((bk) => (
                            <tr key={bk.id} className="hover:bg-white/5 transition-colors">
                                <td className="p-4 text-white font-mono">{bk.date}</td>
                                <td className="p-4">
                                    <span className={`px-2 py-1 rounded text-xs border ${bk.type === 'Full' ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-300' : 'bg-slate-500/10 border-slate-500/30 text-slate-300'}`}>
                                        {bk.type}
                                    </span>
                                </td>
                                <td className="p-4 text-slate-400">{bk.size}</td>
                                <td className="p-4">
                                     <span className="flex items-center gap-1.5 text-emerald-400 text-xs">
                                         <Icons.Check className="w-3 h-3" /> {bk.status}
                                     </span>
                                </td>
                                <td className="p-4 text-right">
                                    <div className="flex justify-end gap-2">
                                        <button className="p-2 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white" title="Download">
                                            <Icons.Download className="w-4 h-4" />
                                        </button>
                                        <button className="p-2 hover:bg-rose-500/20 rounded-lg text-slate-400 hover:text-rose-400" title="Restore">
                                            <Icons.Refresh className="w-4 h-4" />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};