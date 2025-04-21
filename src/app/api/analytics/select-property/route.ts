import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { propertyId } = await request.json();
    console.log('Received property ID:', propertyId); // Debug log

    // Validate property ID format (should be numeric)
    if (propertyId && !/^\d+$/.test(propertyId)) {
      return NextResponse.json({ 
        error: "Invalid property ID format. Expected numeric ID." 
      }, { status: 400 });
    }

    // If propertyId is null, we're clearing the selection
    if (propertyId === null) {
      const { error } = await supabase
        .from('user_settings')
        .update({ 
          ga_property_id: null,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', session.user.id);

      if (error) {
        console.error("Failed to clear property selection:", error);
        return NextResponse.json({ error: "Failed to clear property selection" }, { status: 500 });
      }

      return NextResponse.json({ success: true });
    }

    // Store the raw numeric ID
    const { error } = await supabase
      .from('user_settings')
      .upsert({
        user_id: session.user.id,
        ga_property_id: propertyId, // Store the raw ID
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      });

    if (error) {
      console.error("Failed to save property selection:", error);
      return NextResponse.json({ error: "Failed to save property selection" }, { status: 500 });
    }

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error("Property selection error:", error);
    return NextResponse.json({ 
      error: "Failed to save property selection",
      details: error.message 
    }, { 
      status: 500 
    });
  }
}
