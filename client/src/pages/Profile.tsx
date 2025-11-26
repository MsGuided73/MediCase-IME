import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { userApi } from '../lib/api';
import { useAuth } from '../hooks/useAuth';
import { Navigation } from '../components/Navigation';
import { MedicalDisclaimer } from '../components/MedicalDisclaimer';
import VoiceSettings from '../components/VoiceSettings';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  User, 
  Edit, 
  Shield, 
  Download,
  Trash2,
  AlertTriangle,
  Phone,
  Calendar,
  MapPin,
  Activity,
  Stethoscope,
  Settings
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

const profileSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Valid email is required'),
  dateOfBirth: z.string().optional(),
  gender: z.string().optional(),
  heightCm: z.number().optional(),
  weightKg: z.number().optional(),
  phoneNumber: z.string().optional(),
  emergencyContactName: z.string().optional(),
  emergencyContactPhone: z.string().optional(),
  timezone: z.string().default('UTC'),
});

type ProfileFormData = z.infer<typeof profileSchema>;

export default function Profile() {
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: profile, isLoading } = useQuery({
    queryKey: ['/api/user/profile'],
    queryFn: userApi.getProfile,
  });

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: profile?.firstName || '',
      lastName: profile?.lastName || '',
      email: profile?.email || '',
      dateOfBirth: profile?.dateOfBirth ? profile.dateOfBirth.split('T')[0] : '',
      gender: profile?.gender || '',
      heightCm: profile?.heightCm || undefined,
      weightKg: profile?.weightKg || undefined,
      phoneNumber: profile?.phoneNumber || '',
      emergencyContactName: profile?.emergencyContactName || '',
      emergencyContactPhone: profile?.emergencyContactPhone || '',
      timezone: profile?.timezone || 'UTC',
    },
  });

  React.useEffect(() => {
    if (profile) {
      form.reset({
        firstName: profile.firstName,
        lastName: profile.lastName,
        email: profile.email,
        dateOfBirth: profile.dateOfBirth ? profile.dateOfBirth.split('T')[0] : '',
        gender: profile.gender || '',
        heightCm: profile.heightCm || undefined,
        weightKg: profile.weightKg || undefined,
        phoneNumber: profile.phoneNumber || '',
        emergencyContactName: profile.emergencyContactName || '',
        emergencyContactPhone: profile.emergencyContactPhone || '',
        timezone: profile.timezone || 'UTC',
      });
    }
  }, [profile, form]);

  const updateProfileMutation = useMutation({
    mutationFn: userApi.updateProfile,
    onSuccess: (updatedUser) => {
      queryClient.setQueryData(['/api/user/profile'], updatedUser);
      toast({
        title: "Profile Updated",
        description: "Your profile has been updated successfully.",
      });
      setIsEditingProfile(false);
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update profile",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ProfileFormData) => {
    updateProfileMutation.mutate({
      ...data,
      dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth).toISOString() : undefined,
    });
  };

  const handleCancelEdit = () => {
    form.reset();
    setIsEditingProfile(false);
  };

  const calculateAge = (dateOfBirth: string) => {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  };

  const calculateBMI = (heightCm?: number, weightKg?: number) => {
    if (!heightCm || !weightKg) return null;
    const heightM = heightCm / 100;
    return (weightKg / (heightM * heightM)).toFixed(1);
  };

  const getBMICategory = (bmi: number) => {
    if (bmi < 18.5) return { category: 'Underweight', color: 'text-blue-600 bg-blue-100' };
    if (bmi < 25) return { category: 'Normal', color: 'text-green-600 bg-green-100' };
    if (bmi < 30) return { category: 'Overweight', color: 'text-orange-600 bg-orange-100' };
    return { category: 'Obese', color: 'text-red-600 bg-red-100' };
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <MedicalDisclaimer />
        <Navigation />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-20 md:pb-6">
          <div className="space-y-6">
            <Skeleton className="h-8 w-64" />
            <Card>
              <CardContent className="p-6 space-y-4">
                <Skeleton className="h-16 w-16 rounded-full" />
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-4 w-1/2" />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  const bmi = calculateBMI(profile?.heightCm, profile?.weightKg);
  const bmiInfo = bmi ? getBMICategory(parseFloat(bmi)) : null;

  return (
    <div className="min-h-screen bg-gray-50">
      <MedicalDisclaimer />
      <Navigation />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-20 md:pb-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Profile Settings</h1>
              <p className="text-gray-600 mt-1">Manage your personal information and health data</p>
            </div>
            
            <div className="flex items-center space-x-3 mt-4 sm:mt-0">
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export Data
              </Button>
              
              {!isEditingProfile && (
                <Button onClick={() => setIsEditingProfile(true)} className="bg-blue-600 hover:bg-blue-700">
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Profile
                </Button>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Profile Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Personal Information */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Personal Information</CardTitle>
                    <CardDescription>Your basic profile details</CardDescription>
                  </div>
                  {!isEditingProfile && (
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-xl font-bold text-blue-600">
                        {profile?.firstName?.[0]}{profile?.lastName?.[0]}
                      </span>
                    </div>
                  )}
                </div>
              </CardHeader>
              
              <CardContent>
                {isEditingProfile ? (
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="firstName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>First Name</FormLabel>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="lastName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Last Name</FormLabel>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email Address</FormLabel>
                            <FormControl>
                              <Input {...field} type="email" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="dateOfBirth"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Date of Birth</FormLabel>
                              <FormControl>
                                <Input {...field} type="date" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="gender"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Gender</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select gender" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="male">Male</SelectItem>
                                  <SelectItem value="female">Female</SelectItem>
                                  <SelectItem value="other">Other</SelectItem>
                                  <SelectItem value="prefer-not-to-say">Prefer not to say</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="heightCm"
                          render={({ field: { onChange, ...field } }) => (
                            <FormItem>
                              <FormLabel>Height (cm)</FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  type="number"
                                  onChange={(e) => onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="weightKg"
                          render={({ field: { onChange, ...field } }) => (
                            <FormItem>
                              <FormLabel>Weight (kg)</FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  type="number"
                                  step="0.1"
                                  onChange={(e) => onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={form.control}
                        name="phoneNumber"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Phone Number</FormLabel>
                            <FormControl>
                              <Input {...field} type="tel" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <Separator />

                      <div className="space-y-4">
                        <h4 className="font-medium text-gray-900">Emergency Contact</h4>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="emergencyContactName"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Contact Name</FormLabel>
                                <FormControl>
                                  <Input {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="emergencyContactPhone"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Contact Phone</FormLabel>
                                <FormControl>
                                  <Input {...field} type="tel" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>

                      <div className="flex gap-3 pt-4">
                        <Button 
                          type="submit" 
                          className="bg-blue-600 hover:bg-blue-700"
                          disabled={updateProfileMutation.isPending}
                        >
                          {updateProfileMutation.isPending ? 'Saving...' : 'Save Changes'}
                        </Button>
                        <Button type="button" variant="outline" onClick={handleCancelEdit}>
                          Cancel
                        </Button>
                      </div>
                    </form>
                  </Form>
                ) : (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="text-sm font-medium text-gray-500">Full Name</label>
                        <p className="text-lg font-medium text-gray-900">
                          {profile?.firstName} {profile?.lastName}
                        </p>
                      </div>
                      
                      <div>
                        <label className="text-sm font-medium text-gray-500">Email</label>
                        <p className="text-lg text-gray-900">{profile?.email}</p>
                      </div>

                      {profile?.dateOfBirth && (
                        <div>
                          <label className="text-sm font-medium text-gray-500">Age</label>
                          <p className="text-lg text-gray-900">
                            {calculateAge(profile.dateOfBirth)} years old
                          </p>
                        </div>
                      )}

                      {profile?.gender && (
                        <div>
                          <label className="text-sm font-medium text-gray-500">Gender</label>
                          <p className="text-lg text-gray-900 capitalize">{profile.gender}</p>
                        </div>
                      )}

                      {profile?.phoneNumber && (
                        <div>
                          <label className="text-sm font-medium text-gray-500">Phone</label>
                          <p className="text-lg text-gray-900">{profile.phoneNumber}</p>
                        </div>
                      )}

                      <div>
                        <label className="text-sm font-medium text-gray-500">Member Since</label>
                        <p className="text-lg text-gray-900">
                          {profile?.createdAt ? (() => {
                            try {
                              const date = new Date(profile.createdAt);
                              return isNaN(date.getTime()) ? 'Unknown' : format(date, 'MMMM yyyy');
                            } catch {
                              return 'Unknown';
                            }
                          })() : 'Unknown'}
                        </p>
                      </div>
                    </div>

                    {(profile?.emergencyContactName || profile?.emergencyContactPhone) && (
                      <>
                        <Separator />
                        <div>
                          <h4 className="font-medium text-gray-900 mb-3">Emergency Contact</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {profile?.emergencyContactName && (
                              <div>
                                <label className="text-sm font-medium text-gray-500">Contact Name</label>
                                <p className="text-lg text-gray-900">{profile.emergencyContactName}</p>
                              </div>
                            )}
                            
                            {profile?.emergencyContactPhone && (
                              <div>
                                <label className="text-sm font-medium text-gray-500">Contact Phone</label>
                                <p className="text-lg text-gray-900">{profile.emergencyContactPhone}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Health Stats & Settings */}
          <div className="space-y-6">
            {/* Health Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Activity className="h-5 w-5 mr-2" />
                  Health Stats
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {profile?.heightCm && profile?.weightKg ? (
                  <>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Height</span>
                      <span className="font-medium">{profile.heightCm} cm</span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Weight</span>
                      <span className="font-medium">{profile.weightKg} kg</span>
                    </div>
                    
                    {bmi && bmiInfo && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">BMI</span>
                        <div className="flex items-center space-x-2">
                          <span className="font-medium">{bmi}</span>
                          <Badge className={`text-xs ${bmiInfo.color}`}>
                            {bmiInfo.category}
                          </Badge>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-6 text-gray-500">
                    <Stethoscope className="h-8 w-8 mx-auto mb-2" />
                    <p className="text-sm">Add height and weight to see health stats</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Account Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Settings className="h-5 w-5 mr-2" />
                  Account Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">Account Status</p>
                    <p className="text-sm text-gray-600">Active account</p>
                  </div>
                  <Badge className="bg-green-100 text-green-800">Active</Badge>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">Last Login</p>
                    <p className="text-sm text-gray-600">
                      {profile?.lastLogin
                        ? (() => {
                            try {
                              const date = new Date(profile.lastLogin);
                              return isNaN(date.getTime()) ? 'Invalid date' : format(date, 'MMM d, yyyy h:mm a');
                            } catch {
                              return 'Invalid date';
                            }
                          })()
                        : 'Never'
                      }
                    </p>
                  </div>
                </div>

                <Separator />

                <div className="space-y-3">
                  <Button variant="outline" className="w-full justify-start" size="sm">
                    <Shield className="h-4 w-4 mr-2" />
                    Privacy Settings
                  </Button>
                  
                  <Button variant="outline" className="w-full justify-start" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Export My Data
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50" 
                    size="sm"
                    onClick={logout}
                  >
                    <User className="h-4 w-4 mr-2" />
                    Sign Out
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Danger Zone */}
            <Card className="border-red-200">
              <CardHeader>
                <CardTitle className="flex items-center text-red-900">
                  <AlertTriangle className="h-5 w-5 mr-2" />
                  Danger Zone
                </CardTitle>
                <CardDescription>
                  Irreversible actions that will permanently affect your account
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="destructive" className="w-full">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Account
                    </Button>
                  </DialogTrigger>
                  
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Delete Account</DialogTitle>
                      <DialogDescription>
                        This action cannot be undone. This will permanently delete your account and remove all your data from our servers.
                      </DialogDescription>
                    </DialogHeader>
                    
                    <div className="space-y-4">
                      <div className="p-4 bg-red-50 rounded-lg">
                        <h4 className="font-medium text-red-900 mb-2">What will be deleted:</h4>
                        <ul className="text-sm text-red-800 space-y-1">
                          <li>• All symptom entries and health data</li>
                          <li>• Prescription tracking information</li>
                          <li>• AI assessment results</li>
                          <li>• Account settings and preferences</li>
                        </ul>
                      </div>
                      
                      <div className="flex gap-3">
                        <Button 
                          variant="destructive" 
                          onClick={() => {
                            // Implement account deletion
                            toast({
                              title: "Account deletion not implemented",
                              description: "This feature would permanently delete your account",
                              variant: "destructive",
                            });
                            setDeleteDialogOpen(false);
                          }}
                        >
                          Yes, Delete My Account
                        </Button>
                        <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
                          Cancel
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>

            {/* Voice Settings */}
            <VoiceSettings />
          </div>
        </div>
      </div>
    </div>
  );
}
