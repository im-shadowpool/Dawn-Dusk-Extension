using System;
using System.IO;
using System.Runtime.InteropServices;

namespace AudioDecoder {
    class Program {
        [DllImport("mfplat.dll", ExactSpelling = true)]
        static extern int MFStartup(uint version, uint flags);

        [DllImport("mfplat.dll", ExactSpelling = true)]
        static extern int MFShutdown();

        static void Main(string[] args) {
            const uint MF_VERSION = 0x00020070;
            int hr = MFStartup(MF_VERSION, 0);
            Console.WriteLine("MFStartup: 0x" + hr.ToString("X8"));
            MFShutdown();
        }
    }
}
