import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { UserPlus, Eye, EyeOff } from 'lucide-react';

const personnelSchema = z.object({
  first_name: z.string().min(1, "Nama depan wajib diisi"),
  last_name: z.string().min(1, "Nama belakang wajib diisi"),
  id_number: z.string().regex(/^\d+$/, "Nomor ID harus berupa angka").min(1, "Nomor ID wajib diisi"),
  email: z.string().email("Email tidak valid"),
  password: z.string().min(6, "Password minimal 6 karakter"),
});

type PersonnelFormValues = z.infer<typeof personnelSchema>;

interface PersonnelFormProps {
  onPersonnelAdded: () => void;
}

const PersonnelForm: React.FC<PersonnelFormProps> = ({ onPersonnelAdded }) => {
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<PersonnelFormValues>({
    resolver: zodResolver(personnelSchema),
    defaultValues: {
      first_name: '',
      last_name: '',
      id_number: '',
      email: '',
      password: '',
    },
  });

  const onSubmit = async (values: PersonnelFormValues) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email: values.email,
        password: values.password,
        options: {
          data: {
            first_name: values.first_name,
            last_name: values.last_name,
            id_number: values.id_number,
          },
        },
      });

      if (error) throw error;

      toast.success(`Personel ${values.first_name} ${values.last_name} berhasil ditambahkan!`);
      form.reset();
      onPersonnelAdded();
    } catch (error: unknown) {
      if (error instanceof Error) {
        toast.error(`Gagal menambahkan personel: ${error.message}`);
        console.error("Error adding personnel:", error);
      } else {
        toast.error("Gagal menambahkan personel: Terjadi kesalahan tidak diketahui");
        console.error("Unknown error adding personnel:", error);
      }
    }
  };

  return (
    <Card className="border-0 shadow-2xl bg-gradient-to-br from-white via-blue-50/30 to-white overflow-hidden relative animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-blue-400/10 to-purple-400/10 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-gradient-to-tr from-indigo-400/10 to-blue-400/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
      
      <CardHeader className="bg-gradient-to-r from-[#1e3c72] to-[#2a5298] text-white relative z-10">
        <CardTitle className="flex items-center gap-2 text-xl">
          <UserPlus className="h-6 w-6" />
          Tambah Personel Satpam Baru
        </CardTitle>
      </CardHeader>
      
      <CardContent className="pt-6 relative z-10">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            {/* Baris 1: Nama Depan & Belakang */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="first_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-700 font-semibold">Nama Depan</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Nama Depan" 
                        {...field} 
                        className="border-2 border-gray-200 focus:border-[#2a5298] focus:ring-2 focus:ring-[#2a5298]/20 transition-all duration-200 bg-white"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="last_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-700 font-semibold">Nama Belakang</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Nama Belakang" 
                        {...field} 
                        className="border-2 border-gray-200 focus:border-[#2a5298] focus:ring-2 focus:ring-[#2a5298]/20 transition-all duration-200 bg-white"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Baris 2: Nomor ID (lebih pendek) */}
            <FormField
              control={form.control}
              name="id_number"
              render={({ field }) => (
                <FormItem className="md:w-1/2 md:pr-2">
                  <FormLabel className="text-gray-700 font-semibold">Nomor ID</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="123456" 
                      {...field} 
                      autoComplete="off"
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      className="border-2 border-gray-200 focus:border-[#2a5298] focus:ring-2 focus:ring-[#2a5298]/20 transition-all duration-200 bg-white"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Baris 3: Email & Password */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-700 font-semibold">Email</FormLabel>
                    <FormControl>
                      <Input 
                        type="email" 
                        placeholder="email@example.com" 
                        {...field} 
                        autoComplete="off"
                        className="border-2 border-gray-200 focus:border-[#2a5298] focus:ring-2 focus:ring-[#2a5298]/20 transition-all duration-200 bg-white"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-700 font-semibold">Password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input 
                          type={showPassword ? "text" : "password"}
                          placeholder="Min. 6 karakter" 
                          {...field} 
                          autoComplete="new-password"
                          className="border-2 border-gray-200 focus:border-[#2a5298] focus:ring-2 focus:ring-[#2a5298]/20 transition-all duration-200 bg-white pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-[#2a5298] transition-colors"
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <Button 
              type="submit" 
              className="w-full bg-gradient-to-r from-[#1e3c72] via-[#2a5298] to-[#3a62b8] hover:from-[#2a5298] hover:via-[#3a62b8] hover:to-[#1e3c72] text-white font-bold py-3 transition-all duration-300 shadow-lg hover:shadow-2xl hover:scale-[1.02] hover:-translate-y-0.5 transform group"
            >
              <UserPlus className="mr-2 h-5 w-5 group-hover:rotate-12 transition-transform duration-300" />
              Tambah Personel
            </Button>
          </form>
        </Form>
      </CardContent>

      <style jsx>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-10px);
          }
        }
        
        .delay-1000 {
          animation-delay: 1s;
        }
      `}</style>
    </Card>
  );
};

export default PersonnelForm;